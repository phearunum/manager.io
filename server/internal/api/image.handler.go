package api

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"imanager.io/internal/services"
)

type ImageHandler struct {
	service *services.ImageService
}

func NewImageHandler(s *services.ImageService) *ImageHandler {
	return &ImageHandler{service: s}
}

// Register image routes
func (h *ImageHandler) RegisterRoutes(r *gin.Engine) {
	r.GET("/api/images", h.List)
	r.POST("/api/images/pull", h.Pull)
	r.DELETE("/api/images/:id", h.Remove)
}

// List all images
func (h *ImageHandler) List(c *gin.Context) {
	images, err := h.service.ListImages()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, images)
}

// Pull an image
func (h *ImageHandler) Pull(c *gin.Context) {
	var req struct {
		Ref string `json:"ref" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Image reference is required"})
		return
	}
	if err := h.service.PullImage(req.Ref); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Image pulled successfully"})
}

// Remove an image
func (h *ImageHandler) Remove(c *gin.Context) {
	id := c.Param("id")
	if err := h.service.RemoveImage(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Image removed successfully"})
}
