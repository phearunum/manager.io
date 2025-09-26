// gateway.core.go
package gatewayio

import (
	"fmt"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

// Gateway is the core component that manages routing and policies.
type Gateway struct {
	// Current backend configurations (runtime cache)
	backends       map[string]*BackendConfig
	mu             sync.RWMutex
	BackendService BackendService
}

// NewGateway initializes the Gateway instance.
func NewGateway(svc BackendService) *Gateway {
	// Initial map setup
	initialBackends := svc.GetRuntimeConfigs()
	backendMap := make(map[string]*BackendConfig)
	for _, cfg := range initialBackends {
		backendMap[cfg.ID] = cfg
	}

	return &Gateway{
		backends:       backendMap,
		BackendService: svc,
	}
}

var wsUpgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // Allowing all origins for simplicity. Restrict this in production!
	},
}

// ReloadBackends replaces the current runtime map with the latest configs from the service.
func (g *Gateway) ReloadBackends(configs []*BackendConfig) {
	g.mu.Lock()
	defer g.mu.Unlock()

	newMap := make(map[string]*BackendConfig)
	for _, cfg := range configs {
		newMap[cfg.ID] = cfg
	}

	g.backends = newMap
	log.Println("INFO: Gateway backend list reloaded. Total backends:", len(g.backends))
}

func (g *Gateway) proxyWebSocket(w http.ResponseWriter, r *http.Request, matchedConfig *BackendConfig) {
	// 1. Load Balancing & Target Selection
	targetEndpoint := matchedConfig.GetNextHealthyEndpoint()

	if targetEndpoint == nil {
		log.Printf("ERROR: Backend [%s] has no healthy WS targets for path %s", matchedConfig.ID, r.URL.Path)
		http.Error(w, "503 Service Unavailable: No healthy WS targets found.", http.StatusServiceUnavailable)
		return
	}

	// 2. Prepare Target URL
	// Create the full destination URL (ws://host:port/path...)
	backendURL := targetEndpoint.URLParsed

	// The backend URL scheme must be ws or wss for the client dialer.
	proxyScheme := "ws"
	if backendURL.Scheme == "https" {
		proxyScheme = "wss"
	}

	// CRITICAL: Construct the full URL for the backend connection.
	// The path was already stripped of the PathPrefix in ServeHTTP.
	targetWSURL := url.URL{
		Scheme:   proxyScheme,
		Host:     backendURL.Host,
		Path:     r.URL.Path, // Use the pre-modified path (e.g., /socket.io/)
		RawQuery: r.URL.RawQuery,
	}

	log.Printf("INFO: Upgrading and proxying WS from %s to %s", r.RemoteAddr, targetWSURL.String())

	// 3. Upgrade Client Connection (Hijacking)
	clientConn, err := wsUpgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("ERROR: Failed to upgrade client to WebSocket: %v", err)
		return // Upgrade failure already sends a 4xx response
	}
	defer clientConn.Close()

	// 4. Dial Backend WebSocket Server
	backendConn, _, err := websocket.DefaultDialer.Dial(targetWSURL.String(), r.Header)
	if err != nil {
		log.Printf("ERROR: Failed to dial backend WS %s: %v", targetWSURL.String(), err)
		// If backend dial fails, close the client connection gracefully.
		clientConn.CloseHandler()(websocket.CloseInternalServerErr, "Backend connection failed")
		return
	}
	defer backendConn.Close()

	// 5. Bidirectional Pumping (Proxying Data)
	// The core of the proxy: two goroutines to copy data concurrently.

	// Channel to signal when one side closes
	done := make(chan struct{})

	// Client -> Backend (Read from client, write to backend)
	go func() {
		defer close(done) // Signal shutdown on exit
		if err := proxyData(clientConn, backendConn); err != nil {
			log.Printf("WS Proxy Error (Client->Backend): %v", err)
		}
	}()

	// Backend -> Client (Read from backend, write to client)
	go func() {
		defer close(done) // Signal shutdown on exit
		if err := proxyData(backendConn, clientConn); err != nil {
			log.Printf("WS Proxy Error (Backend->Client): %v", err)
		}
	}()

	// Wait for either the client or the backend to close the connection.
	<-done

	// Ensure both connections are closed gracefully.
	clientConn.WriteControl(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.CloseGoingAway, "Gateway closing"), time.Now().Add(5*time.Second))
	backendConn.WriteControl(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.CloseGoingAway, "Gateway closing"), time.Now().Add(5*time.Second))

	log.Printf("INFO: WebSocket connection closed for route %s", matchedConfig.PathPrefix)
}

// proxyData is a helper function to read data from source and write to destination.
func proxyData(src, dst *websocket.Conn) error {
	for {
		// Read message from the source connection
		messageType, p, err := src.ReadMessage()
		if err != nil {
			// Check if error is due to normal closure
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseNormalClosure) {
				return err
			}
			return nil // Normal closure or expected error
		}

		// Write the same message type and payload to the destination connection
		if err := dst.WriteMessage(messageType, p); err != nil {
			return err
		}
	}
}

// ServeHTTP is the handler for Gin's r.NoRoute. It performs routing, load balancing, and proxying.
func (g *Gateway) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	g.mu.RLock()
	defer g.mu.RUnlock()

	// 1. Route Lookup
	var matchedConfig *BackendConfig
	longestMatchLen := 0
	for _, config := range g.backends {
		if strings.HasPrefix(r.URL.Path, config.PathPrefix) {
			if len(config.PathPrefix) > longestMatchLen {
				longestMatchLen = len(config.PathPrefix)
				matchedConfig = config
			}
		}
	}

	if matchedConfig == nil {
		http.Error(w, "404 Not Found: No matching backend route.", http.StatusNotFound)
		return
	}

	isWebSocket := r.Header.Get("Connection") == "Upgrade" && r.Header.Get("Upgrade") == "websocket"

	if isWebSocket && matchedConfig.Protocol == "WS" {
		// ... Path trimming logic ...
		g.proxyWebSocket(w, r, matchedConfig)
		return
	}
	// 3. LOAD BALANCING (HTTP/S Path)
	targetEndpoint := matchedConfig.GetNextHealthyEndpoint()

	if targetEndpoint == nil {
		log.Printf("ERROR: Backend [%s] has no healthy endpoints for path %s", matchedConfig.ID, r.URL.Path)
		http.Error(w, "503 Service Unavailable: No healthy targets found.", http.StatusServiceUnavailable)
		return
	}

	// 4. Proxy the Request (HTTP/S)
	proxy := httputil.NewSingleHostReverseProxy(targetEndpoint.URLParsed)

	proxy.Director = func(req *http.Request) {
		// Standard Reverse Proxy Configuration
		req.URL.Scheme = targetEndpoint.URLParsed.Scheme
		req.URL.Host = targetEndpoint.URLParsed.Host
		req.Host = targetEndpoint.URLParsed.Host

		// 🛑 FIX: The correct approach is to combine the backend's base path
		// with the remaining client path.
		// Get the path segment after the matched PathPrefix.
		remainingPath := strings.TrimPrefix(r.URL.Path, matchedConfig.PathPrefix)

		// Append it to the target endpoint's base path.
		// This handles cases where the backend expects path segments.
		targetPath := targetEndpoint.URLParsed.Path
		if !strings.HasSuffix(targetPath, "/") && !strings.HasPrefix(remainingPath, "/") {
			targetPath += "/"
		}
		req.URL.Path = targetPath + remainingPath
	}

	proxy.ServeHTTP(w, r)
}

// StartHealthChecks runs the periodic health check in a goroutine.
func (g *Gateway) StartHealthChecks() {
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		g.mu.RLock()
		backendsToCheck := make(map[string]*BackendConfig, len(g.backends))
		for id, cfg := range g.backends {
			backendsToCheck[id] = cfg
		}
		g.mu.RUnlock()

		var wg sync.WaitGroup
		for _, backend := range backendsToCheck {
			wg.Add(1)
			go func(b *BackendConfig) {
				defer wg.Done()
				g.checkBackend(b)
			}(backend)
		}
		wg.Wait()
	}
}
func (g *Gateway) checkBackend(b *BackendConfig) {
	client := http.Client{Timeout: 2 * time.Second}

	// 🛑 Iterate over all endpoints within this configuration
	for _, endpoint := range b.Endpoints {
		// Ensure URLParsed is not nil before attempting String() (safety check)
		if endpoint.URLParsed == nil {
			log.Printf("ERROR: Endpoint %s for config %s has unparsed URL, skipping health check.", endpoint.URL, b.ID)
			continue
		}

		targetURL := endpoint.URLParsed.String()

		// --- CONFIGURABLE LATENCY THRESHOLD ---
		const maxLatency = 500 * time.Millisecond

		var (
			statusText string = "DOWN"
			isHealthy  bool   = false
			logMessage string
		)

		start := time.Now()
		resp, err := client.Get(targetURL)
		latency := time.Since(start)

		if err != nil {
			logMessage = fmt.Sprintf("Network Error: %v", err)
		} else {
			defer resp.Body.Close()
			statusCode := resp.StatusCode

			if statusCode == http.StatusOK || statusCode == http.StatusUnauthorized {
				if latency <= maxLatency {
					isHealthy = true
					statusText = "UP"
					logMessage = "HTTP OK/Unauthorized"
				} else {
					logMessage = fmt.Sprintf("High latency: %s (> %s)", latency, maxLatency)
				}
			} else {
				logMessage = fmt.Sprintf("HTTP Status Code: %d", statusCode)
			}
		}

		// 1. Update the health status on the specific endpoint instance (IN MEMORY)
		endpoint.IsHealthy = isHealthy

		// 2. 🛑 CRITICAL FIX: Call the service to persist the status and record history.
		g.BackendService.SetHealthStatus(b.ID, endpoint.URL, isHealthy, latency)

		log.Printf("  -> Health Check: [%s - Endpoint %d] (%s) is %s. Latency: %s. Reason: %s",
			b.ID, endpoint.ID, targetURL, statusText, latency, logMessage)
	}
}
func AccessLoggingHandler(g *Gateway) gin.HandlerFunc {
	return func(c *gin.Context) {
		r := c.Request
		w := c.Writer
		start := time.Now()

		// 1. Wrap the Gin ResponseWriter with the StatusRecorder.
		recorder := &StatusRecorder{ResponseWriter: w, Status: http.StatusOK}

		// 2. Execute the Gateway's main proxy logic (s.Gateway.ServeHTTP)
		// This is where the request is sent to the target backend.
		g.ServeHTTP(recorder, r)

		// 3. Status Code and Latency are determined after the request returns
		finalStatus := recorder.Status
		if finalStatus == 0 {
			finalStatus = w.Status()
		}
		latency := time.Since(start)

		// 4. Determine BackendID by re-running the lookup logic
		// The lookup logic must match the one used in g.ServeHTTP.
		var backendID string
		longestMatchLen := 0

		g.mu.RLock() // Lock the map for reading
		for _, config := range g.backends {
			if strings.HasPrefix(r.URL.Path, config.PathPrefix) {
				if len(config.PathPrefix) > longestMatchLen {
					longestMatchLen = len(config.PathPrefix)
					backendID = config.ID // Found the matching ID
				}
			}
		}
		g.mu.RUnlock()

		if backendID == "" {
			backendID = "NO_MATCH"
		}

		// 5. Record the log in the service layer
		err := g.BackendService.RecordAccessLog(
			backendID,
			latency,
			r.Method,
			r.URL.Path,
			r.RemoteAddr,
			finalStatus,
		)

		if err != nil {
			log.Printf("ERROR: Failed to record access log for %s: %v", r.URL.Path, err)
		}

		log.Printf("  -> ACCESS LOGGED: [%s] %s %s from %s. Status: %d. Latency: %s",
			backendID, r.Method, r.URL.Path, r.RemoteAddr, finalStatus, latency.String())
	}
}

// Add this method to your BackendConfig struct definition (likely in gatewayio/models.go or similar)

// GetNextHealthyEndpoint implements a thread-safe, simple Round Robin load balancing strategy.
func (b *BackendConfig) GetNextHealthyEndpoint() *BackendEndpoint {
	// b.mu is the mutex defined in BackendConfig for this purpose
	b.mu.Lock()
	defer b.mu.Unlock()

	if b.Endpoints == nil {
		return nil
	}
	numEndpoints := len(b.Endpoints)
	if numEndpoints == 0 {
		return nil
	}

	// Iterate up to N times (where N is numEndpoints) to find the next HEALTHY endpoint
	for i := 0; i < numEndpoints; i++ {
		// Calculate the index for the current attempt
		// b.currentLBIndex is the non-persisted int field in BackendConfig
		index := (b.currentLBIndex + i) % numEndpoints
		endpoint := b.Endpoints[index]

		// Check health status and ensure the URL was parsed (URLParsed != nil)
		if endpoint.IsHealthy && endpoint.URLParsed != nil {
			// Update the index for the next request
			b.currentLBIndex = (index + 1) % numEndpoints
			return endpoint
		}
	}

	// Fallback: No healthy endpoint found after one full cycle
	return nil
}
