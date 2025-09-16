package services

import (
	"imanager.io/internal/docker"
	"imanager.io/internal/models"
)

type ImageService struct {
	dockerClient *docker.DockerClient
}

func NewImageService(dc *docker.DockerClient) *ImageService {
	return &ImageService{dockerClient: dc}
}

func (s *ImageService) ListImages() ([]models.Image, error) {
	images, err := s.dockerClient.ListImages()
	if err != nil {
		return nil, err
	}
	result := make([]models.Image, 0, len(images))
	for _, img := range images {
		result = append(result, models.Image{
			ID:       img.ID,
			RepoTags: img.RepoTags,
			Size:     img.Size,
			Created:  img.Created,
		})
	}
	return result, nil
}

func (s *ImageService) RemoveImage(id string) error {
	return s.dockerClient.RemoveImage(id)
}

func (s *ImageService) PullImage(ref string) error {
	return s.dockerClient.PullImage(ref)
}
