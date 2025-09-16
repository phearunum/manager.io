package api

import (
	"io"
	"net/http"

	"github.com/docker/docker/api/types"
	"github.com/gin-gonic/gin"
	"imanager.io/internal/services"
)

type ContainerHandler struct {
	service *services.ContainerService
}

func NewContainerHandler(s *services.ContainerService) *ContainerHandler {
	return &ContainerHandler{service: s}
}

// Register all container routes
func (h *ContainerHandler) RegisterRoutes(r *gin.Engine) {
	r.GET("/api/containers", h.List)
	r.POST("/api/containers/start/:id", h.Start)
	r.POST("/api/containers/stop/:id", h.Stop)
	r.GET("/api/containers/view/:id", h.View)
	r.GET("/api/containers/logs/:id", h.Logs)
	r.GET("/api/containers/stats/:id", h.Stats)
}

// List containers
func (h *ContainerHandler) List(c *gin.Context) {
	containers, err := h.service.ListContainers(true)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, containers)
}

// Start a container
func (h *ContainerHandler) Start(c *gin.Context) {
	id := c.Param("id")
	if err := h.service.StartContainer(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Container started"})
}

// Stop a container
func (h *ContainerHandler) Stop(c *gin.Context) {
	id := c.Param("id")
	if err := h.service.StopContainer(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Container stopped"})
}

// New: View container details
func (h *ContainerHandler) View(c *gin.Context) {
	id := c.Param("id")
	info, err := h.service.InspectContainer(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, info)
}

// New: Stream container logs
// Stream container logs as SSE
func (h *ContainerHandler) Logs(c *gin.Context) {
	id := c.Param("id")
	rc, err := h.service.StreamLogs(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rc.Close()

	// SSE headers
	c.Writer.Header().Set("Content-Type", "text/event-stream")
	c.Writer.Header().Set("Cache-Control", "no-cache")
	c.Writer.Header().Set("Connection", "keep-alive")
	c.Writer.Header().Set("Access-Control-Allow-Origin", "*") // if CORS needed

	buf := make([]byte, 1024)
	for {
		n, err := rc.Read(buf)
		if n > 0 {
			// Send each chunk as SSE message
			c.Writer.Write([]byte("data: " + string(buf[:n]) + "\n\n"))
			c.Writer.Flush()
		}
		if err != nil {
			if err == io.EOF {
				break
			} else {
				break
			}
		}
	}
}

// New: Get container live stats
func (h *ContainerHandler) Stats(c *gin.Context) {
	id := c.Param("id")
	stats, err := h.service.StatesContainer(id) // your service method returning types.StatsJSON
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id": id,
		"cpu": gin.H{
			"percent": calculateCPUPercent(&stats),
		},
		"memory": gin.H{
			"usage":   stats.MemoryStats.Usage,
			"limit":   stats.MemoryStats.Limit,
			"percent": float64(stats.MemoryStats.Usage) / float64(stats.MemoryStats.Limit) * 100,
		},
		"network": gin.H{
			"rx_bytes": getNetworkRx(&stats),
			"tx_bytes": getNetworkTx(&stats),
			"rx_kb":    float64(getNetworkRx(&stats)) / 1024,
			"tx_kb":    float64(getNetworkTx(&stats)) / 1024,
		},
	})

}

// Helper functions
func calculateCPUPercent(stats *types.StatsJSON) float64 {
	cpuDelta := float64(stats.CPUStats.CPUUsage.TotalUsage - stats.PreCPUStats.CPUUsage.TotalUsage)
	systemDelta := float64(stats.CPUStats.SystemUsage - stats.PreCPUStats.SystemUsage)

	if systemDelta > 0 && cpuDelta > 0 {
		numCPUs := 1.0
		if stats.CPUStats.CPUUsage.PercpuUsage != nil {
			numCPUs = float64(len(stats.CPUStats.CPUUsage.PercpuUsage))
		}
		return (cpuDelta / systemDelta) * numCPUs * 100.0
	}
	return 0
}

func getNetworkRx(stats *types.StatsJSON) uint64 {
	var rx uint64
	if stats.Networks != nil {
		for _, v := range stats.Networks {
			rx += v.RxBytes
		}
	}
	return rx
}

func getNetworkTx(stats *types.StatsJSON) uint64 {
	var tx uint64
	if stats.Networks != nil {
		for _, v := range stats.Networks {
			tx += v.TxBytes
		}
	}
	return tx
}
