import React, { useState, useEffect, type JSX } from "react";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf,
  FaHistory,
  FaEdit,
  FaTrash,
  FaPlusCircle,
} from "react-icons/fa";
import { FiClock } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getEndpointList } from "@/services/docker.apt"; // Assuming this now fetches the list of BackendConfig[]
import EndpointForm from "@/components/endpoint/endpoint-form";
import Modal from "@/components/endpoint/modal";
import { Wifi, WifiOff } from "lucide-react";

// Define the shape of a single Backend Endpoint (the actual server target)
interface BackendEndpoint {
  id: number; // Assuming ID is numeric in the DB
  backendConfigId: string;
  url: string;
  isHealthy: boolean;
  Protocol: string;
}

// Define the shape of a single Backend Configuration (the route prefix)
interface BackendConfig {
  id: string;
  pathPrefix: string; // The primary routing field
  endpoints: BackendEndpoint[]; // 🛑 CRITICAL: The array of targets
  rateLimit: number;
  authType: string;
  lastUpdated: string; // ISO 8601 timestamp string
  Protocol: string;
}

const API_BASE_URL = "http://localhost:8080/config/v1/backends";

const EndPointList: React.FC = () => {
  // 🛑 State now holds an array of CONFIGURATIONS
  const [configs, setConfigs] = useState<BackendConfig[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Modal State Management
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | undefined>(undefined);

  const navigate = useNavigate();

  useEffect(() => {
    loadConfigs();
  }, []);

  // 🛑 Renamed function to reflect data change
  const loadConfigs = async () => {
    try {
      // Assuming getEndpointList now fetches the new structure
      const data: BackendConfig[] = await getEndpointList();
      setConfigs(data);
    } catch (err) {
      setError("Failed to load backend configurations from service.");
      console.error("Service call error:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- Modal Open/Close Handlers ---
  const handleOpenCreate = () => {
    setModalMode("create");
    setEditingId(undefined);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (id: string) => {
    setModalMode("edit");
    setEditingId(id);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(undefined);
  };

  const handleFormSuccess = (successMessage: string) => {
    setMessage(successMessage);
    handleCloseModal();
    loadConfigs(); // Reload data
    setTimeout(() => setMessage(null), 5000);
  };

  // --- Delete Handler ---
  const handleDelete = async (id: string) => {
    if (
      !window.confirm(
        `Are you sure you want to delete the full configuration for route ID ${id.substring(
          0,
          8
        )}...?`
      )
    ) {
      return;
    }
    try {
      await axios.delete(`${API_BASE_URL}/${id}`);
      setMessage(
        `Configuration ${id.substring(0, 8)}... deleted successfully.`
      );
      loadConfigs();
      setTimeout(() => setMessage(null), 5000);
    } catch (err: any) {
      const msg =
        err.response?.data?.error || "Failed to delete configuration.";
      setError(msg);
    }
  };

  // 🛑 Updated indicator logic to handle null/empty endpoints gracefully
  const getStatusIndicator = (isHealthy: boolean): JSX.Element => {
    const baseClasses =
      "inline-flex items-center px-2 py-0 text-sm font-semibold rounded-full";
    if (isHealthy === true) {
      return (
        <span className={`${baseClasses} bg-green-100 text-green-800`}>
          <Wifi size={13} /> up
        </span>
      );
    }
    if (isHealthy === false) {
      return (
        <span className={`${baseClasses} bg-red-100 text-red-800 text-sm `}>
          <WifiOff size={13} /> down
        </span>
      );
    }
    return (
      <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>
        <FaHourglassHalf className="mr-2" /> Checking...
      </span>
    );
  };

  const formatTimestamp = (timestamp: string): string => {
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return "N/A";
    }
  };

  const handleViewHistory = (id: string) => {
    navigate(`/backends/${id}/history`);
  };

  if (loading)
    return (
      <div className="p-8 text-lg text-gray-700">
        Loading backend configurations...
      </div>
    );
  if (error)
    return (
      <div className="p-8 text-lg text-red-600 border border-red-300 bg-red-50 rounded-lg">
        {error}
      </div>
    );

  // 🛑 Function to determine the overall health status of a configuration
  const getOverallHealth = (config: BackendConfig): boolean | null => {
    if (!config.endpoints || config.endpoints.length === 0) return null;

    // If at least one is healthy, we consider the config available
    return config.endpoints.some((ep) => ep.isHealthy);
  };

  return (
    <div className="p-2 md:p-2 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">
          API Gateway Configurations ({configs.length})
        </h2>
        {/* Button to open Create Modal */}
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150"
        >
          <FaPlusCircle className="mr-2" />
          Add New Configuration
        </button>
      </div>

      {/* Success Message Display */}
      {message && (
        <div className="p-4 mb-4 text-sm text-green-700 bg-green-100 rounded-lg">
          {message}
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/5"
                >
                  Route Path / ID
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/7"
                >
                  Protocol
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/5"
                >
                  Load Balanced Endpoints (Status)
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Policy
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Updated
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {configs.map((config) => (
                <tr
                  key={config.id}
                  className={
                    getOverallHealth(config) === true
                      ? "hover:bg-green-50/50"
                      : getOverallHealth(config) === false
                      ? "hover:bg-red-50/50"
                      : "hover:bg-gray-50"
                  }
                >
                  {/* Column 1: Route Path / ID */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {config.pathPrefix}
                    <p className="font-mono text-xs text-gray-500 mt-0.5">
                      {config.id.substring(0, 100)}
                    </p>
                  </td>
                  {/* Column 1: Route Path / ID */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    <span className="inline-flex items-center px-2  text-sm font-semibold rounded-full bg-blue-100 px-2  text-sm">
                      {config.Protocol}
                    </span>
                  </td>
                  {/* 🛑 Column 2: Load Balanced Endpoints (New Logic) */}
                  <td className="px-6 py-4">
                    {config.endpoints && config.endpoints.length > 0 ? (
                      <div className="space-y-1">
                        {config.endpoints.map((ep) => (
                          <div
                            key={ep.id}
                            className="flex items-center space-x-2"
                          >
                            {getStatusIndicator(ep.isHealthy)}
                            <code
                              className="text-xs text-gray-600 truncate"
                              title={ep.url}
                            >
                              {ep.url}
                            </code>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-yellow-600 font-medium">
                        <FaTimesCircle className="inline mr-1" /> No Endpoints
                        Configured (503)
                      </p>
                    )}
                  </td>

                  {/* Column 3: Policy */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <p className="text-sm">Rate: {config.rateLimit} reqs</p>
                    <span className="bg-gray-200 text-gray-800 text-xs font-medium px-2 py-0.5 rounded-full">
                      Auth: {config.authType}
                    </span>
                  </td>

                  {/* Column 4: Last Updated */}
                  <td className="px-6 py-1 whitespace-nowrap text-sm text-gray-500">
                    <span
                      title={config.lastUpdated}
                      className="flex items-center"
                    >
                      <FiClock className="mr-1.5 w-4 h-4" />
                      {formatTimestamp(config.lastUpdated)}
                    </span>
                  </td>

                  {/* Column 5: Actions */}
                  <td className="px-6 py-1 whitespace-nowrap text-right text-sm font-medium space-x-2 flex justify-center">
                    {/* Edit Button */}
                    <button
                      onClick={() => handleOpenEdit(config.id)}
                      className="p-2 border border-transparent text-sm font-medium rounded-full text-white bg-blue-500 hover:bg-blue-600 transition"
                      title="Edit Configuration"
                    >
                      <FaEdit className="w-3 h-3" />
                    </button>
                    {/* Delete Button */}
                    <button
                      onClick={() => handleDelete(config.id)}
                      className="p-2 border border-transparent text-sm font-medium rounded-full text-white bg-red-500 hover:bg-red-600 transition"
                      title="Delete Configuration"
                    >
                      <FaTrash className="w-3 h-3" />
                    </button>
                    {/* History Button */}
                    <button
                      onClick={() => handleViewHistory(config.id)}
                      className="p-2 border border-transparent text-sm font-medium rounded-full text-white bg-indigo-600 hover:bg-indigo-700 transition"
                      title="View Health History"
                    >
                      <FaHistory className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- Modal Component --- */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={
          modalMode === "create"
            ? "Create New Configuration"
            : `Edit Configuration: ${editingId?.substring(0, 8)}...`
        }
      >
        <EndpointForm
          mode={modalMode}
          endpointId={editingId}
          onSuccess={handleFormSuccess}
          onCancel={handleCloseModal}
        />
      </Modal>
    </div>
  );
};

export default EndPointList;
