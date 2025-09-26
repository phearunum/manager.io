// gateway.repository.go
package gatewayio

import (
	"fmt"
	"time"

	"gorm.io/gorm"
)

// BackendRepository defines the methods for data access.
type BackendRepository interface {
	Migrate() error
	Create(cfg *BackendConfig) error
	GetAll() ([]*BackendConfig, error)
	//UpdateHealth(id string, isHealthy bool) error
	UpdateEndpointHealth(configID string, endpointURL string, isHealthy bool) error
	SaveHealthHistory(record *HealthHistory) error
	GetHealthHistory(query *HistoryQueryDTO) ([]*HealthHistory, error)
	CreateAccessLog(logEntry *AccessLog) error
}

type gormRepository struct {
	db *gorm.DB
}

func NewGormRepository(db *gorm.DB) BackendRepository {
	return &gormRepository{db: db}
}

func (r *gormRepository) Migrate() error {
	return r.db.AutoMigrate(&BackendConfig{}, &BackendEndpoint{}, &HealthHistory{}, &AccessLog{})
}

func (r *gormRepository) Create(cfg *BackendConfig) error {
	return r.db.Create(cfg).Error
}
func (r *gormRepository) CreateAccessLog(logEntry *AccessLog) error {
	if err := r.db.Create(logEntry).Error; err != nil {
		return fmt.Errorf("failed to create access log: %w", err)
	}
	return nil
}

// gateway.repository.go

func (r *gormRepository) GetAll() ([]*BackendConfig, error) {
	var configs []*BackendConfig
	if err := r.db.Preload("Endpoints").Find(&configs).Error; err != nil {
		return nil, err
	}

	return configs, nil
}

func (r *gormRepository) UpdateHealth(id string, isHealthy bool) error {
	return r.db.Model(&BackendConfig{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"is_healthy":   isHealthy,
			"last_updated": time.Now(),
		}).Error
}
func (r *gormRepository) SaveHealthHistory(record *HealthHistory) error {
	return r.db.Create(record).Error
}

// NEW: Implementation to fetch history records based on query parameters.
func (r *gormRepository) GetHealthHistorys(query *HistoryQueryDTO) ([]*HealthHistory, error) {

	var historyStructs []HealthHistory

	db := r.db.Where("backend_id = ?", query.BackendID).Order("checked_at DESC")

	if !query.StartTime.IsZero() {
		db = db.Where("checked_at >= ?", query.StartTime)
	}
	if !query.EndTime.IsZero() {
		db = db.Where("checked_at <= ?", query.EndTime)
	}
	if query.Limit > 0 {
		db = db.Limit(query.Limit)
	}
	if err := db.Find(&historyStructs).Error; err != nil {
		return nil, err
	}
	historyPointers := make([]*HealthHistory, len(historyStructs))
	for i := range historyStructs {
		historyPointers[i] = &historyStructs[i]
	}

	return historyPointers, nil // Return the slice of pointers
}

func (r *gormRepository) GetHealthHistory(query *HistoryQueryDTO) ([]*HealthHistory, error) {
	var history []*HealthHistory
	db := r.db.Where("backend_id = ?", query.BackendID).Order("checked_at DESC")
	if err := db.Find(&history).Error; err != nil {
		return nil, err
	}
	return history, nil // Return the slice of pointers directly
}

func (r *gormRepository) UpdateEndpointHealth(configID string, endpointURL string, isHealthy bool) error {
	// Target the BackendEndpoint model
	return r.db.Model(&BackendEndpoint{}).
		// Use BOTH criteria (Config ID and URL) to precisely locate the single endpoint instance
		Where("backend_config_id = ?", configID).
		Where("url = ?", endpointURL).
		// Update the health status
		Update("is_healthy", isHealthy).Error
}
