import React, { useState, useEffect } from "react";
import { FaSave, FaTimes } from "react-icons/fa";
import axios from "axios";

// Define the shape of the form data
interface FormData {
  targetUrl: string;
  rateLimit: number | "";
  authType: string;
}

// Define props for the component
interface EndpointFormProps {
  mode: "create" | "edit";
  endpointId?: string; // Optional ID for edit mode
  onSuccess: (message: string) => void;
  onCancel: () => void;
}

const API_BASE_URL = "http://localhost:8080/config/v1/backends";

const EndpointForm: React.FC<EndpointFormProps> = ({
  mode,
  endpointId,
  onSuccess,
  onCancel,
}) => {
  const [formData, setFormData] = useState<FormData>({
    targetUrl: "",
    rateLimit: 5,
    authType: "NONE",
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(mode === "edit");

  // --- Data Fetching for Edit Mode ---
  useEffect(() => {
    if (mode === "edit" && endpointId) {
      setLoading(true);
      const fetchEndpoint = async () => {
        try {
          const response = await axios.get(`${API_BASE_URL}/${endpointId}`);
          const data = response.data;
          setFormData({
            targetUrl: data.targetUrl || "",
            rateLimit: data.rateLimit || 5,
            authType: data.authType || "NONE",
          });
        } catch (err) {
          setError("Failed to load endpoint data.");
        } finally {
          setLoading(false);
          setIsInitialLoad(false);
        }
      };
      fetchEndpoint();
    }
  }, [mode, endpointId]);

  // --- Handlers ---
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "rateLimit" ? (value === "" ? "" : Number(value)) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (
      !formData.targetUrl ||
      formData.rateLimit === "" ||
      formData.rateLimit <= 0
    ) {
      setError("Target URL and Rate Limit must be valid.");
      setLoading(false);
      return;
    }

    try {
      const payload = { ...formData, rateLimit: Number(formData.rateLimit) };
      if (mode === "create") {
        await axios.post(API_BASE_URL, payload);
        onSuccess("Endpoint created successfully!");
      } else if (mode === "edit" && endpointId) {
        await axios.put(`${API_BASE_URL}/${endpointId}`, payload);
        onSuccess("Endpoint updated successfully!");
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || `Failed to ${mode} endpoint.`;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (isInitialLoad)
    return <div className="text-gray-700">Loading form...</div>;

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
          {error}
        </div>
      )}

      {/* Target URL */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Target URL
        </label>
        <input
          type="url"
          name="targetUrl"
          value={formData.targetUrl}
          onChange={handleChange}
          placeholder="e.g., http://localhost:4000"
          required
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* Rate Limit */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Rate Limit (Reqs/min)
        </label>
        <input
          type="number"
          name="rateLimit"
          value={formData.rateLimit}
          onChange={handleChange}
          min="1"
          required
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* Auth Type */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Authentication Type
        </label>
        <select
          name="authType"
          value={formData.authType}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white"
        >
          <option value="NONE">NONE</option>
          <option value="JWT">JWT</option>
          <option value="API_KEY">API_KEY</option>
        </select>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
          disabled={loading}
        >
          <FaTimes className="mr-2" />
          Cancel
        </button>
        <button
          type="submit"
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
          disabled={loading}
        >
          <FaSave className="mr-2" />
          {loading
            ? "Saving..."
            : mode === "create"
            ? "Create Endpoint"
            : "Save Changes"}
        </button>
      </div>
    </form>
  );
};

export default EndpointForm;
