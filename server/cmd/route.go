package main

import (
	"log"
	"time"

	service "imanager.io/internal/services"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"imanager.io/config"
	"imanager.io/internal/api"
	docker "imanager.io/internal/docker"
)

type SendMessageRequest struct {
	GroupID string `json:"groups"`
	Message string `json:"msg"`
	Phone   string `json:"phone"`
}

var whitelist = map[string]bool{
	"/api/auth02/github/login":                 true,
	"/api/auth02/logout":                       true,
	"/api/account/auth02/github/login":         true,
	"/api/auth02/github/callback":              true,
	"/api/swagger/index.html":                  true,
	"/swagger/index.html":                      true,
	"/swagger/swagger-ui-bundle.js":            true,
	"/swagger/swagger-ui.css":                  true,
	"/swagger/swagger-ui-standalone-preset.js": true,
	"/swagger/doc.json":                        true,
	"/swagger/favicon-32x32.png":               true,
	"/swagger/favicon-16x16.png":               true,
}

func InitRoutes(cfg config.Config, s *Services) *gin.Engine {
	// Init Docker client
	cli, err := docker.NewDockerClient()
	if err != nil {
		log.Fatalf("Error creating Docker client: %v", err)
	}

	// Initialize service layer
	containerService := service.NewContainerService(cli)
	imageService := service.NewImageService(cli)

	// Initialize API handlers
	containerHandler := api.NewContainerHandler(containerService)
	imageHandler := api.NewImageHandler(imageService)

	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins: []string{
			"http://localhost:5173",
			"http://192.168.50.102:5173",
		},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))
	containerHandler.RegisterRoutes(r)
	imageHandler.RegisterRoutes(r)
	return r
}
