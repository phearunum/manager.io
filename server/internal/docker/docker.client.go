package docker

import (
	"context"
	"encoding/json"
	"io"
	"log"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	"github.com/docker/docker/client"
)

type DockerClient struct {
	cli *client.Client
	ctx context.Context
}

// ContainerInfo is a simplified wrapper around types.Container
type ContainerInfo struct {
	ID        string
	Names     []string
	Image     string
	State     string
	Status    string
	Created   int64
	Ports     []types.Port // Published ports
	Network   types.NetworkSettings
	PrivateIP string
	Owner     string
}

func NewDockerClient() (*DockerClient, error) {
	cli, err := client.NewClientWithOpts(
		client.WithHost("unix:///var/run/docker.sock"), // macOS Docker Desktop
		client.WithAPIVersionNegotiation(),
	)
	if err != nil {
		return nil, err
	}

	return &DockerClient{
		cli: cli,
		ctx: context.Background(),
	}, nil
}

// Container operations
func (d *DockerClient) ListContainers(all bool) ([]types.Container, error) {
	return d.cli.ContainerList(context.Background(), types.ContainerListOptions{All: all})
}
func (d *DockerClient) ListContainersDetailed(all bool) ([]ContainerInfo, error) {
	containers, err := d.cli.ContainerList(context.Background(), types.ContainerListOptions{All: all})
	if err != nil {
		return nil, err
	}

	var result []ContainerInfo

	for _, c := range containers {
		inspect, err := d.cli.ContainerInspect(context.Background(), c.ID)
		if err != nil {
			return nil, err
		}

		info := ContainerInfo{
			ID:      c.ID,
			Names:   c.Names,
			Image:   c.Image,
			State:   c.State,
			Status:  c.Status,
			Created: c.Created,
			Ports:   c.Ports,
			Network: *inspect.NetworkSettings, // full network config
		}

		result = append(result, info)
	}

	return result, nil
}

func (d *DockerClient) StartContainer(id string) error {
	return d.cli.ContainerStart(d.ctx, id, container.StartOptions{})
}

func (d *DockerClient) StopContainer(id string) error {
	timeout := 10
	return d.cli.ContainerStop(d.ctx, id, container.StopOptions{
		Timeout: &timeout,
	})
}

// Image operations
func (d *DockerClient) ListImages() ([]types.ImageSummary, error) {
	return d.cli.ImageList(d.ctx, types.ImageListOptions{})
}

func (d *DockerClient) PullImage(ref string) error {
	rc, err := d.cli.ImagePull(d.ctx, ref, types.ImagePullOptions{})
	if err != nil {
		return err
	}
	defer rc.Close()
	_, err = io.Copy(io.Discard, rc)
	if err != nil {
		log.Println("Warning reading pull response:", err)
	}
	return nil
}

func (d *DockerClient) RemoveImage(id string) error {
	_, err := d.cli.ImageRemove(d.ctx, id, types.ImageRemoveOptions{Force: true})
	return err
}

// Get container details
func (d *DockerClient) InspectContainer(id string) (types.ContainerJSON, error) {
	return d.cli.ContainerInspect(d.ctx, id)
}
func (d *DockerClient) ContainerStats(id string) (types.StatsJSON, error) {
	statsResp, err := d.cli.ContainerStats(d.ctx, id, false)
	if err != nil {
		return types.StatsJSON{}, err
	}
	defer statsResp.Body.Close()

	var stats types.StatsJSON
	err = json.NewDecoder(statsResp.Body).Decode(&stats)
	if err != nil {
		return types.StatsJSON{}, err
	}

	return stats, nil
}

// Stream container logs
func (d *DockerClient) StreamLogs(id string) (io.ReadCloser, error) {
	return d.cli.ContainerLogs(
		d.ctx,
		id,
		types.ContainerLogsOptions{
			ShowStdout: true,
			ShowStderr: true,
			Follow:     true,
			Timestamps: false,
			Tail:       "100",
		},
	)
}
