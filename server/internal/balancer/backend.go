package balancer

import (
	"net/url"
	"sync"
)

// Backend holds the data about a single backend server.
type Backend struct {
	URL   *url.URL
	Alive bool
	// Mutex to protect the Alive field during concurrent updates (e.g., from health checks)
	Mutex sync.RWMutex
}

// SetAlive sets the status of the backend.
func (b *Backend) SetAlive(alive bool) {
	b.Mutex.Lock()
	b.Alive = alive
	b.Mutex.Unlock()
}

// IsAlive returns the health status of the backend.
func (b *Backend) IsAlive() (alive bool) {
	b.Mutex.RLock()
	alive = b.Alive
	b.Mutex.RUnlock()
	return
}
