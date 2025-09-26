import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8009/",
  timeout: 5000,
});

export const listContainers = () => api.get("api/containers");
export const startContainer = (id: string) =>
  api.post(`/containers/start/${id}`);
export const stopContainer = (id: string) =>
  api.post(`api/containers/stop/${id}`);
export const deleteContainer = (id: string) =>
  api.delete(`api/containers/${id}`);

export const listImages = () => api.get("api/images");
export const pullImage = (ref: string) =>
  api.post(`api/images/pull?ref=${ref}`);
export const removeImage = (id: string) => api.delete(`api/images/${id}`);

export const stateContainer = (id: string) =>
  api.get(`api/containers/stats/${id}`);
export const inspectContainer = (id: string) =>
  api.get(`api/containers/view/${id}`);

// Logs should be streamed using EventSource
export const streamContainerLogs = (id: string) =>
  new EventSource(`http://localhost:8009/api/containers/logs/${id}`);

export const getEndpointList = async () => {
  // eslint-disable-next-line no-useless-catch
  try {
    const response = await api.get(`/config/v1/backends`);
    return response.data; // Return the data payload
  } catch (error) {
    // Re-throw the error so the calling component can catch it
    throw error;
  }
};
export interface HealthHistory {
  backendId: string;
  isHealthy: boolean;
  checkedAt: string; // ISO 8601 timestamp
}

export const getEndpointHistory = async (
  id: string
): Promise<HealthHistory[]> => {
  // eslint-disable-next-line no-useless-catch
  try {
    const response = await api.get(`/config/v1/backends/${id}/history`);
    return response.data;
  } catch (error) {
    throw error;
  }
};
