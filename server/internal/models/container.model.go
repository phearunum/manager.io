package models

import "github.com/docker/docker/api/types"

type Container struct {
	ID        string                `json:"id"`
	Names     []string              `json:"names"`
	Image     string                `json:"image"`
	PrivateIP string                `json:"privateIP"`
	Ports     []types.Port          `json:"ports"`   // host -> container port
	Network   types.NetworkSettings `json:"network"` // full network info
	State     string                `json:"state"`
	Status    string                `json:"status"`
	Created   int64                 `json:"created"`
	Owner     string                `json:"owner"`
}

type Image struct {
	ID       string   `json:"id"`
	RepoTags []string `json:"repoTags"`
	Size     int64    `json:"size"`
	Created  int64    `json:"created"`
}
