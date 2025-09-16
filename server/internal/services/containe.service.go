package services

import (
	"io"

	"github.com/docker/docker/api/types"
	"imanager.io/internal/docker"
	"imanager.io/internal/models"
)

type ContainerService struct {
	dockerClient *docker.DockerClient
}

func NewContainerService(dc *docker.DockerClient) *ContainerService {
	return &ContainerService{dockerClient: dc}
}

func (s *ContainerService) ListContainers(all bool) ([]models.Container, error) {
	containers, err := s.dockerClient.ListContainersDetailed(all)
	if err != nil {
		return nil, err
	}

	result := make([]models.Container, 0, len(containers))
	for _, c := range containers {
		var privateIP string
		if c.Network.Networks != nil {
			for _, netSettings := range c.Network.Networks {
				if netSettings.IPAddress != "" {
					privateIP = netSettings.IPAddress
					break // take first non-empty IP
				}
			}
		}

		// Get container owner (user inside container)
		containerJSON, err := s.dockerClient.InspectContainer(c.ID)
		var owner string
		if err == nil {
			owner = containerJSON.Config.User
			if owner == "" {
				owner = "root" // default user if not set
			}
		} else {
			owner = "unknown"
		}

		result = append(result, models.Container{
			ID:        c.ID,
			Names:     c.Names,
			Image:     c.Image,
			Ports:     c.Ports,
			Network:   c.Network,
			PrivateIP: privateIP,
			State:     c.State,
			Status:    c.Status,
			Created:   c.Created,
			Owner:     owner,
		})
	}
	return result, nil
}

func (s *ContainerService) StartContainer(id string) error {
	return s.dockerClient.StartContainer(id)
}
func (s *ContainerService) StopContainer(id string) error {
	return s.dockerClient.StopContainer(id)
}

// Inspect container details
func (s *ContainerService) InspectContainer(id string) (types.ContainerJSON, error) {
	return s.dockerClient.InspectContainer(id)
}
func (s *ContainerService) StatesContainer(id string) (types.StatsJSON, error) {
	return s.dockerClient.ContainerStats(id)
}

// Stream container logs
func (s *ContainerService) StreamLogs(id string) (io.ReadCloser, error) {
	return s.dockerClient.StreamLogs(id)
}
