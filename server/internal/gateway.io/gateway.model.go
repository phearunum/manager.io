package gatewayio

import (
	"log"
	"net/url"
	"sync"
	"time"

	"gorm.io/gorm"
)

// BackendEndpoint represents a single physical instance (server) for a backend config.
type BackendEndpoint struct {
	ID              uint     `gorm:"primarykey" json:"id"`
	BackendConfigID string   `gorm:"type:uuid;not null;index" json:"backendConfigId"`
	URL             string   `gorm:"type:varchar(255);not null" json:"url"`
	IsHealthy       bool     `gorm:"default:true" json:"isHealthy"` // Health status of this specific instance
	URLParsed       *url.URL `gorm:"-" json:"-"`
}

// BackendConfig represents a single API service configuration (the core model).
type BackendConfig struct {
	ID string `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	//  NEW FIELD: PathPrefix for routing (e.g., "/service-a/")
	PathPrefix     string             `gorm:"type:varchar(255);not null;default:'/'" json:"pathPrefix"`
	Protocol       string             // e.g., "HTTP", "WS"
	Endpoints      []*BackendEndpoint `gorm:"foreignKey:BackendConfigID" json:"endpoints"`
	RateLimit      int                `gorm:"not null" json:"rateLimit"`
	AuthType       string             `gorm:"type:varchar(50);not null" json:"authType"`
	LastUpdated    time.Time          `gorm:"autoUpdateTime" json:"lastUpdated"`
	DeletedAt      gorm.DeletedAt     `gorm:"index" json:"-"`
	currentLBIndex int                `gorm:"-"`
	mu             sync.RWMutex
}

// BackendConfigDTO for API requests
type BackendConfigDTO struct {
	PathPrefix string   `json:"pathPrefix" binding:"required"`
	TargetURLs []string `json:"targetUrls" binding:"required"`
	RateLimit  int      `json:"rateLimit" binding:"required"`
	AuthType   string   `json:"authType" binding:"required"`
}

func (b *BackendConfig) EnsureURLsParsed() {
	for _, ep := range b.Endpoints {
		// Only parse if it hasn't been parsed yet (it's nil)
		if ep.URLParsed == nil {
			u, err := url.Parse(ep.URL)
			if err == nil {
				ep.URLParsed = u
			} else {
				log.Printf("CRITICAL URL ERROR: Failed to parse URL %s for config %s: %v", ep.URL, b.ID, err)
				ep.URLParsed = nil
				// If the URL is invalid, mark the endpoint as permanently unhealthy
				ep.IsHealthy = false
			}
		}
	}
}

// HealthHistory records the health status of a backend at a specific time.
type HealthHistory struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	BackendID string         `gorm:"type:uuid;not null;index" json:"backendId"`
	IsHealthy bool           `gorm:"not null" json:"isHealthy"`
	Latency   int64          `json:"Latency"`
	CheckedAt time.Time      `gorm:"index;autoCreateTime" json:"checkedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// HistoryQueryDTO defines the structure for fetching history (from frontend request).
type HistoryQueryDTO struct {
	BackendID string    `json:"backendId" binding:"required"`
	StartTime time.Time `json:"startTime"`
	EndTime   time.Time `json:"endTime"`
	Limit     int       `json:"limit"`
}

type AccessLog struct {
	ID         uint           `gorm:"primarykey" json:"id"`
	BackendID  string         `gorm:"type:uuid;not null;index" json:"backendId"`
	Timestamp  time.Time      `gorm:"index;autoCreateTime" json:"timestamp"`
	Latency    int64          `gorm:"not null" json:"Latency"` // Stored as nanoseconds
	Method     string         `gorm:"type:varchar(10);not null" json:"method"`
	Path       string         `gorm:"type:text;not null" json:"path"`
	ClientIP   string         `gorm:"type:varchar(45);not null" json:"clientIP"`
	StatusCode int            `gorm:"type:int;not null" json:"statusCode"`
	DeletedAt  gorm.DeletedAt `gorm:"index" json:"-"`
}
