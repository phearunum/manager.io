package main

import (
	"log"

	"gorm.io/gorm"
	"imanager.io/config"
	gatewayio "imanager.io/internal/gateway.io"
)

type Services struct {
	Config         *config.Config
	Gateway        *gatewayio.Gateway
	BackendService gatewayio.BackendService
}

func InitServices(db *gorm.DB, cfg *config.Config) *Services {
	backendRepo := gatewayio.NewGormRepository(db)
	if err := backendRepo.Migrate(); err != nil {
		log.Fatalf("Failed to run database migrations: %v", err)
	}

	gateway := &gatewayio.Gateway{}
	backendService := gatewayio.NewBackendService(backendRepo, gateway)
	gateway.BackendService = backendService
	go gateway.StartHealthChecks()

	return &Services{
		Config:         cfg,
		Gateway:        gateway,
		BackendService: backendService, // Expose service for handlers
	}
}
