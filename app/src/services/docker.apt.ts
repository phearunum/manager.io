import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8009/api",
  timeout: 5000,
});

export const listContainers = () => api.get("/containers");
export const startContainer = (id: string) =>
  api.post(`/containers/start/${id}`);
export const stopContainer = (id: string) => api.post(`/containers/stop/${id}`);
export const deleteContainer = (id: string) => api.delete(`/containers/${id}`);

export const listImages = () => api.get("/images");
export const pullImage = (ref: string) => api.post(`/images/pull?ref=${ref}`);
export const removeImage = (id: string) => api.delete(`/images/${id}`);

export const stateContainer = (id: string) =>
  api.get(`/containers/stats/${id}`);
export const inspectContainer = (id: string) =>
  api.get(`/containers/view/${id}`);

// Logs should be streamed using EventSource
export const streamContainerLogs = (id: string) =>
  new EventSource(`http://localhost:8009/api/containers/logs/${id}`);
