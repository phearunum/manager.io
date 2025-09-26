package balancer

import (
	"log"
	"net/http"
	"net/http/httputil"
	"sync/atomic"
	"time"
)

// ServerPool manages the list of backends and the load balancing index.
type ServerPool struct {
	backends []*Backend
	current  uint64 // Atomic counter for Round Robin
}

// AddBackend adds a new backend to the server pool.
func (s *ServerPool) AddBackend(backend *Backend) {
	s.backends = append(s.backends, backend)
}

// GetNextPeer selects the next healthy backend using Round Robin.
func (s *ServerPool) GetNextPeer() *Backend {
	// Loop until a healthy backend is found or all backends are checked
	for i := 0; i < len(s.backends); i++ {
		// Increment the counter atomically and calculate the index
		nextIndex := atomic.AddUint64(&s.current, 1) % uint64(len(s.backends))

		peer := s.backends[nextIndex]
		if peer.IsAlive() {
			return peer
		}
	}
	// If the loop finishes, no healthy backend was found
	return nil
}

// ServeHTTP implements the http.Handler interface for the load balancer.
func (s *ServerPool) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	// 1. Load Balancing: Get the next healthy backend
	targetBackend := s.GetNextPeer()
	if targetBackend == nil {
		log.Printf("ERR: All backends are down.")
		http.Error(w, "Service Unavailable", http.StatusServiceUnavailable)
		return
	}
	proxy := httputil.NewSingleHostReverseProxy(targetBackend.URL)
	proxy.Director = func(req *http.Request) {
		req.Host = targetBackend.URL.Host // Ensure correct Host header for backend
		req.URL.Host = targetBackend.URL.Host
		req.URL.Scheme = targetBackend.URL.Scheme

		// Centralized Authorization/Tracing Header Injection
		req.Header.Set("X-Gateway-Auth", "user-id-123")
	}
	proxy.ServeHTTP(w, r)
}

// HealthCheck runs in a goroutine to periodically check backend health.
func (s *ServerPool) HealthCheck() {
	t := time.NewTicker(2 * time.Second)
	for {
		<-t.C // Wait for the ticker to tick
		log.Println("Starting Health Check...")
		for _, b := range s.backends {
			status := "DOWN"
			isAlive := s.isBackendAlive(b)
			b.SetAlive(isAlive)
			if isAlive {
				status = "UP"
			}
			log.Printf("  -> Backend [%s] is %s\n", b.URL.String(), status)
		}
	}
}

// isBackendAlive pings the backend's URL to check its health.
func (s *ServerPool) isBackendAlive(b *Backend) bool {
	client := http.Client{Timeout: 1 * time.Second}
	resp, err := client.Get(b.URL.String())
	if err != nil {
		return false
	}
	defer resp.Body.Close()
	return resp.StatusCode == http.StatusOK
}
