package main

import (
	"fmt"
	"log"
	"time"

	"gorm.io/gorm"
	"imanager.io/config"
	"imanager.io/utils"
)

func InitConfigAndDatabase() (config.Config, *gorm.DB) {
	cfg, err := config.LoadConfig("config/config.yml")
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}
	db := config.InitDatabase("config/config.yml")
	utils.InitializeLogger(cfg.Service.LogPtah)
	loc, err := time.LoadLocation(cfg.Service.TimeZone)
	if err == nil {
		now := time.Now().In(loc)
		fmt.Printf("Current Time in %s: %s\n", cfg.Service.TimeZone, now)
		fmt.Printf("UTC Time: %s\n", time.Now().UTC())
	}

	return cfg, db
}
