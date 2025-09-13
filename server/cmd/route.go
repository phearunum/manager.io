package main

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"imanager.io/config"
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
	r := gin.Default()
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:8080", "http://localhost:3000", "http://192.168.50.102:8080"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))
	return r
}
