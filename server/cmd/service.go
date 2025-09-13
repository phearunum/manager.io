package main

import (
	"gorm.io/gorm"
	"imanager.io/config"
)

type Services struct {
	Config *config.Config
}

func InitServices(db *gorm.DB, cfg *config.Config) *Services {

	return &Services{}
}
