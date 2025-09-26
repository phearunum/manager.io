package gatewayio

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

// GatewayConfigHandler exposes configuration endpoints and interacts with the service layer.
type GatewayConfigHandler struct {
	service BackendService // Uses the BackendService interface defined in gateway.service.go
}
type StatusRecorder struct {
	http.ResponseWriter
	Status int
}

// WriteHeader implements the http.ResponseWriter interface method.
// It intercepts the status code before passing it to the original writer.
func (r *StatusRecorder) WriteHeader(status int) {
	r.Status = status
	r.ResponseWriter.WriteHeader(status)
}

// Write implements the http.ResponseWriter interface method.
func (r *StatusRecorder) Write(b []byte) (int, error) {
	// If Write is called before WriteHeader, the status is 200 by default.
	if r.Status == 0 {
		r.Status = http.StatusOK
	}
	return r.ResponseWriter.Write(b)
}

// Header implements the http.ResponseWriter interface method.
func (r *StatusRecorder) Header() http.Header {
	return r.ResponseWriter.Header()
}

// NewGatewayConfigHandler initializes the handler with the business logic service.
func NewGatewayConfigHandler(s BackendService) *GatewayConfigHandler {
	return &GatewayConfigHandler{service: s}
}

// CreateConfig handles POST /config/v1/backends to register a new endpoint.
func (h *GatewayConfigHandler) CreateConfig(c *gin.Context) {
	var dto BackendConfigDTO

	// 1. Bind and validate the JSON payload
	if err := c.ShouldBindJSON(&dto); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input format: " + err.Error()})
		return
	}

	// 2. Call the Service Layer to create the configuration (DB persistence, cache update, Gateway reload)
	newConfig, err := h.service.Create(&dto)
	if err != nil {
		log.Printf("ERROR saving config: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save configuration"})
		return
	}

	// 3. Return a successful response
	c.JSON(http.StatusCreated, gin.H{
		"id":      newConfig.ID,
		"message": "Backend configuration saved and gateway reloaded.",
		"status":  "success",
	})
}

// ListConfigs handles GET /config/v1/backends to retrieve all registered endpoints.
func (h *GatewayConfigHandler) ListConfigs(c *gin.Context) {
	configs := h.service.GetRuntimeConfigs()

	// 2. Return the list
	c.JSON(http.StatusOK, configs)
}
func (h *GatewayConfigHandler) GetHealthHistory(c *gin.Context) {
	backendID := c.Param("id")
	query := &HistoryQueryDTO{
		BackendID: backendID,
	}
	history, err := h.service.GetHistory(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve history"})
		return
	}

	c.JSON(http.StatusOK, history)
}

// In your gateway/gateway.go or the file defining AccessLoggingHandler
