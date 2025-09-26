// gateway.service.go
package gatewayio

import (
	"fmt"
	"log"
	"net/url"
	"sync"
	"time"

	"github.com/google/uuid"
)

// NOTE: Assuming BackendConfig, BackendConfigDTO, BackendRepository, and Gateway are defined elsewhere in the gatewayio package.

// BackendService defines the service methods.
type BackendService interface {
	Create(dto *BackendConfigDTO) (*BackendConfig, error)
	GetAll() ([]*BackendConfig, error)
	GetRuntimeConfigs() []*BackendConfig
	//SetHealthStatus(id string, isHealthy bool, letency time.Duration)
	GetHistory(query *HistoryQueryDTO) ([]*HealthHistory, error)
	SetHealthStatus(configID string, endpointURL string, isHealthy bool, latency time.Duration)
	RecordAccessLog(
		backendID string,
		latency time.Duration,
		method string,
		path string,
		clientIP string,
		statusCode int,
	) error
}

// backendService implements the core business logic.
type backendService struct {
	repo    BackendRepository
	gateway *Gateway

	runtimeCache map[string]*BackendConfig
	mu           sync.RWMutex
}

func NewBackendService(repo BackendRepository, gateway *Gateway) BackendService {
	s := &backendService{
		repo:         repo,
		gateway:      gateway,
		runtimeCache: make(map[string]*BackendConfig),
	}
	s.loadCacheFromRepo()
	return s
}
func (s *backendService) RecordAccessLog(
	backendID string,
	latency time.Duration,
	method string,
	path string,
	clientIP string,
	statusCode int,
) error {

	// Convert time.Duration to int64 (nanoseconds) for GORM storage
	latencyNs := latency.Nanoseconds()

	logEntry := &AccessLog{
		BackendID:  backendID,
		Latency:    latencyNs, // Store as int64
		Method:     method,
		Path:       path,
		ClientIP:   clientIP,
		StatusCode: statusCode,
		// ID and Timestamp will be handled by GORM on creation
	}

	// Call the repository to save the record
	return s.repo.CreateAccessLog(logEntry)
}

// gateway.service.go (inside loadCacheFromRepo)
// gateway.service.go

// loadCacheFromRepo loads all configurations from the repository, ensures URLs are parsed,
// and replaces the Gateway's runtime cache.
func (s *backendService) loadCacheFromRepo() {
	// 1. Fetch configs from DB (Repository is expected to Preload Endpoints)
	configs, err := s.repo.GetAll()
	if err != nil {
		log.Printf("ERROR loading configs from DB: %v. Starting with empty cache.", err)
		return
	}

	// List to be reloaded is built before the lock is acquired.
	configsForReload := make([]*BackendConfig, 0, len(configs))

	s.mu.Lock()

	s.runtimeCache = make(map[string]*BackendConfig)
	for _, cfg := range configs {
		// 2. 🛑 CRITICAL: Ensure all URLs in the endpoints are parsed.
		// This prevents nil pointer panics in the core gateway logic.
		cfg.EnsureURLsParsed()

		s.runtimeCache[cfg.ID] = cfg
		configsForReload = append(configsForReload, cfg)

		// OPTIONAL: Add debug logging to confirm successful loading
		endpointCount := 0
		for _, ep := range cfg.Endpoints {
			if ep.URLParsed != nil {
				endpointCount++
			}
		}
		log.Printf("DEBUG: Loaded Config - Path: %s, ID: %s, Ready Endpoints: %d/%d",
			cfg.PathPrefix, cfg.ID, endpointCount, len(cfg.Endpoints))
	}

	s.mu.Unlock() // Lock released

	// 3. Trigger Gateway to use the loaded and parsed list.
	s.gateway.ReloadBackends(configsForReload)
}

// gatewayio/gateway.service.go (Updated Create function)

func (s *backendService) Create(dto *BackendConfigDTO) (*BackendConfig, error) {
	// Generate ID before DB call
	newID := uuid.New().String()

	newConfig := &BackendConfig{
		ID:          newID,
		PathPrefix:  dto.PathPrefix, // Use the new PathPrefix field
		RateLimit:   dto.RateLimit,
		AuthType:    dto.AuthType,
		LastUpdated: time.Now(),
	}

	// 🛑 NEW LOGIC: Create BackendEndpoint structs for each URL
	endpoints := make([]*BackendEndpoint, 0, len(dto.TargetURLs))
	for _, rawURL := range dto.TargetURLs {
		parsedURL, err := url.Parse(rawURL)
		if err != nil {
			return nil, fmt.Errorf("invalid target URL (%s): %w", rawURL, err)
		}

		endpoint := &BackendEndpoint{
			BackendConfigID: newID,
			URL:             rawURL,
			IsHealthy:       false, // Initial status is DOWN
			URLParsed:       parsedURL,
		}
		endpoints = append(endpoints, endpoint)
	}
	newConfig.Endpoints = endpoints

	// 1. Persist to DB (Repo must handle saving Config AND associated Endpoints)
	if err := s.repo.Create(newConfig); err != nil {
		return nil, fmt.Errorf("failed to save config and endpoints to DB: %w", err)
	}

	// --- 2. Update Cache & Build Reload List (Atomic) ---
	var configsForReload []*BackendConfig

	s.mu.Lock()
	s.runtimeCache[newConfig.ID] = newConfig

	configsForReload = make([]*BackendConfig, 0, len(s.runtimeCache))
	for _, cfg := range s.runtimeCache {
		configsForReload = append(configsForReload, cfg)
	}
	s.mu.Unlock()

	// 3. Reload the gateway.
	s.gateway.ReloadBackends(configsForReload)

	return newConfig, nil
}
func (s *backendService) GetAll() ([]*BackendConfig, error) {
	return s.GetRuntimeConfigs(), nil
}

func (s *backendService) GetRuntimeConfigs() []*BackendConfig {
	s.mu.RLock()
	defer s.mu.RUnlock()

	list := make([]*BackendConfig, 0, len(s.runtimeCache))
	for _, config := range s.runtimeCache {
		list = append(list, config)
	}
	return list
}

// gateway.service.go

func (s *backendService) SetHealthStatus_(configID string, endpointURL string, isHealthy bool, latency time.Duration) {
	// 1. Locate the BackendConfig in the runtime cache
	s.mu.RLock()
	cfg, ok := s.runtimeCache[configID]
	s.mu.RUnlock()

	if !ok {
		log.Printf("WARN: Health check received for unknown backend ID: %s", configID)
		return
	}

	// 2. Find the specific BackendEndpoint instance
	var targetEndpoint *BackendEndpoint
	for _, ep := range cfg.Endpoints {
		if ep.URL == endpointURL {
			targetEndpoint = ep
			break
		}
	}

	if targetEndpoint == nil {
		log.Printf("WARN: Health check received for unknown endpoint URL: %s in config %s", endpointURL, configID)
		return
	}

	// 3. Record Health History (Convert latency to int64 for persistence)
	latencyNs := latency.Nanoseconds()
	historyRecord := &HealthHistory{
		BackendID: configID, // Log history against the config ID
		IsHealthy: isHealthy,
		Latency:   latencyNs,
	}
	if err := s.repo.SaveHealthHistory(historyRecord); err != nil {
		log.Printf("ERROR saving health history for %s: %v", configID, err)
	}

	// 4. Update the runtime status and persist ONLY if the health status has changed
	if targetEndpoint.IsHealthy == isHealthy {
		return // Status hasn't changed, skip DB update
	}
	// Update status in the IN-MEMORY cache (already protected by RLock above,
	// but the write must happen)
	targetEndpoint.IsHealthy = isHealthy
	// 5. Persist the new status to the database
	if err := s.repo.UpdateEndpointHealth(configID, endpointURL, isHealthy); err != nil {
		log.Printf("ERROR persisting health status for %s (%s): %v", configID, endpointURL, err)
	}

	log.Printf("INFO: Health status updated for Endpoint %s (Config %s). New Status: %t", endpointURL, configID, isHealthy)
}
func (s *backendService) SetHealthStatus(configID string, endpointURL string, isHealthy bool, latency time.Duration) {
	// 1. Locate the BackendConfig in the runtime cache
	s.mu.RLock()
	cfg, ok := s.runtimeCache[configID]
	s.mu.RUnlock()

	if !ok {
		log.Printf("WARN: Health check received for unknown backend ID: %s", configID)
		return
	}

	// 2. Find the specific BackendEndpoint instance
	var targetEndpoint *BackendEndpoint
	for _, ep := range cfg.Endpoints {
		if ep.URL == endpointURL {
			targetEndpoint = ep
			break
		}
	}

	if targetEndpoint == nil {
		log.Printf("WARN: Health check received for unknown endpoint URL: %s in config %s", endpointURL, configID)
		return
	}

	// 3. Record Health History (Convert latency to int64 for persistence)
	latencyNs := latency.Nanoseconds()
	historyRecord := &HealthHistory{
		BackendID: configID, // Log history against the config ID
		IsHealthy: isHealthy,
		Latency:   latencyNs,
	}
	if err := s.repo.SaveHealthHistory(historyRecord); err != nil {
		log.Printf("ERROR saving health history for %s: %v", configID, err)
		// Note: We continue even if history save fails, as persistence is more critical
	}

	// 4. Update the runtime status and persist ONLY if the health status has changed
	if targetEndpoint.IsHealthy == isHealthy {
		return // Status hasn't changed, skip DB update
	}

	// Update status in the IN-MEMORY cache
	targetEndpoint.IsHealthy = isHealthy

	// 5. Persist the new status to the database
	if err := s.repo.UpdateEndpointHealth(configID, endpointURL, isHealthy); err != nil {
		// 🛑 This log entry must be showing up in your console if the DB update fails.
		// It's the most crucial place to look for SQL errors or transaction failures.
		log.Printf("CRITICAL ERROR: Failed to persist health status for %s (%s): %v", endpointURL, configID, err)
		return
	}

	log.Printf("INFO: Health status UPDATED for Endpoint %s (Config %s). New Status: %t", endpointURL, configID, isHealthy)
}
func (s *backendService) GetHistory(query *HistoryQueryDTO) ([]*HealthHistory, error) {
	// The repository handles the filtering and ordering
	return s.repo.GetHealthHistory(query)
}
