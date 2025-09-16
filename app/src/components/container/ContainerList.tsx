import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  listContainers,
  startContainer,
  stopContainer,
  deleteContainer,
} from "@/services/docker.apt";
import {
  ArrowUp,
  CirclePause,
  CirclePlay,
  FileBox,
  Package,
  RotateCwSquare,
  Skull,
  SquareArrowOutUpRight,
  Trash,
  Wifi,
  WifiOff,
} from "lucide-react";
interface ContainerPort {
  IP: string;
  PrivatePort: number;
  PublicPort?: number; // might be undefined if not published
  Type: string; // usually "tcp" or "udp"
}
interface Container {
  id: string;
  names: string[];
  image: string;
  ports: ContainerPort[];
  network: Record<string, unknown>;
  privateIP: string;
  state: string;
  status: string;
  owner: string;
  created: number;
}

export const ContainerList = () => {
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  const fetchContainers = async () => {
    setLoading(true);
    try {
      const res = await listContainers();
      setContainers(res.data);
    } catch (err) {
      console.error("Error fetching containers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContainers();
  }, []);

  // --- Selection ---
  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === containers.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(containers.map((c) => c.id)));
    }
  };

  const selectedContainers = containers.filter((c) => selected.has(c.id));
  const hasSelection = selected.size > 0;
  const allRunning = selectedContainers.every((c) => c.state === "running");
  const allStopped = selectedContainers.every((c) => c.state !== "running");

  // --- Bulk actions ---
  const handleBulk = async (action: "start" | "stop" | "remove") => {
    try {
      for (const id of selected) {
        if (action === "start") await startContainer(id);
        if (action === "stop") await stopContainer(id);
        if (action === "remove") await deleteContainer(id);
      }
      await fetchContainers();
      setSelected(new Set());
    } catch (err) {
      console.error("Bulk action error:", err);
    }
  };

  return (
    <div className="p-0  text-right">
      {/* Toolbar */}
      <div className="flex justify-between items-center p-2">
        {/* Left: Title with Icon */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <Package className="text-blue-600 w-6 h-6" />
          </div>
          <h1
            className="text-2xl font-bold tracking-tight dark:text-gray-100"
            data-testid="text-page-title"
          >
            Container
          </h1>
        </div>

        {/* Right: Toolbar */}
        <div className="inline-flex rounded-md overflow-hidden border border-gray-300 gap-1">
          {/* Start */}
          <button
            disabled={!hasSelection || allRunning}
            onClick={() => handleBulk("start")}
            className={`px-3 py-1 border-r border-gray-300 flex items-center gap-1 ${
              !hasSelection || allRunning
                ? "bg-green-100/50 text-green-300 cursor-not-allowed"
                : "bg-green-100/50 text-green-700 hover:bg-green-600 hover:text-white"
            }`}
          >
            <CirclePlay size={16} /> Start
          </button>

          {/* Stop */}
          <button
            disabled={!hasSelection || allStopped}
            onClick={() => handleBulk("stop")}
            className={`px-3 py-1 border-r border-gray-300 flex items-center gap-1 ${
              !hasSelection || allStopped
                ? "bg-red-100/50 text-red-300 cursor-not-allowed"
                : "bg-red-100/50 text-red-700 hover:bg-red-600 hover:text-white"
            }`}
          >
            <RotateCwSquare size={16} /> Stop
          </button>

          {/* Resume */}
          <button
            disabled={!hasSelection}
            onClick={() => handleBulk("resume")}
            className={`px-3 py-1 border-r border-gray-300 flex items-center gap-1 ${
              !hasSelection
                ? "bg-gray-100/50 text-gray-300 cursor-not-allowed"
                : "bg-gray-100/50 text-gray-700 hover:bg-gray-600 hover:text-white"
            }`}
          >
            <CirclePlay size={16} /> Resume
          </button>

          {/* Push */}
          <button
            disabled={!hasSelection}
            onClick={() => handleBulk("push")}
            className={`px-3 py-1 border-r border-gray-300 flex items-center gap-1 ${
              !hasSelection
                ? "bg-gray-100/50 text-gray-300 cursor-not-allowed"
                : "bg-gray-100/50 text-blue-700 hover:bg-blue-600 hover:text-white"
            }`}
          >
            <CirclePause size={16} /> Push
          </button>

          {/* Kill */}
          <button
            disabled={!hasSelection}
            onClick={() => handleBulk("kill")}
            className={`px-3 py-1 flex items-center gap-1 ${
              !hasSelection
                ? "bg-gray-100/50 text-gray-300 cursor-not-allowed"
                : "bg-gray-100/50 text-red-700 hover:bg-red-600 hover:text-white"
            }`}
          >
            <Skull size={16} /> Kill
          </button>

          {/* Remove */}
          <button
            disabled={!hasSelection}
            onClick={() => handleBulk("remove")}
            className={`px-3 py-1 flex items-center gap-1 ${
              !hasSelection
                ? "bg-gray-100/50 text-gray-300 cursor-not-allowed"
                : "bg-gray-100/50 text-gray-700 hover:bg-gray-600 hover:text-white"
            }`}
          >
            <Trash size={16} /> Remove
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <p>Loading containers...</p>
      ) : (
        <div className="overflow-x-auto rounded-lg mt-3">
          <table className="min-w-full bg-white dark:bg-gray-800 dark:text-gray-100 text-base">
            <thead className="bg-gray-100 dark:bg-gray-700 border-b dark:border-gray-600">
              <tr>
                <th className="px-4 py-2 text-left">
                  <input
                    type="checkbox"
                    checked={
                      selected.size === containers.length &&
                      containers.length > 0
                    }
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Image</th>
                <th className="px-4 py-2 text-left">State</th>
                <th className="px-4 py-2 text-left">IPs</th>
                <th className="px-4 py-2 text-left ">Ports</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left ">Owner</th>
                <th className="px-4 py-2 text-right ">Created</th>
              </tr>
            </thead>
            <tbody>
              {containers.map((c) => (
                <tr
                  key={c.id}
                  className={`border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    selected.has(c.id) ? "bg-blue-100 dark:bg-blue-800" : ""
                  }`}
                >
                  <td className="px-4 py-2 text-left">
                    <input
                      type="checkbox"
                      checked={selected.has(c.id)}
                      onChange={() => toggleSelect(c.id)}
                    />
                  </td>
                  <td className="px-4 py-2 text-left">
                    <button
                      onClick={() => navigate(`/container/v/${c.id}`)}
                      className="text-blue-500 hover:underline dark:text-blue-400 cursor-pointer text-left"
                    >
                      {(c.names || ["<no name>"]).join(", ")}
                    </button>
                  </td>
                  <td className="px-4 py-2 text-left">
                    <div className="flex items-center gap-2 cursor-pointer">
                      <FileBox size={16} className="text-gray-600" />
                      <span title={c.image}>
                        {c.image.length > 80
                          ? c.image.slice(0, 80) + "…"
                          : c.image}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-2">
                    {c.state === "running" ? (
                      <span className="flex items-center gap-2 cursor-pointe px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">
                        <Wifi size={12} /> {c.state}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 cursor-pointe px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded">
                        <WifiOff size={12} /> {c.state}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-left">{c.privateIP}</td>
                  <td className="px-4 py-2 text-left truncate max-w-[300px]">
                    {c.ports.length > 0 ? (
                      Array.from(
                        new Map(
                          c.ports
                            .filter((p) => p.IP !== "::") // Only IPv4
                            .map((p) => [
                              `${p.Type}-${p.PrivatePort}-${p.PublicPort}`,
                              p,
                            ])
                        ).values()
                      ).map((p) => {
                        const url =
                          p.PublicPort !== undefined
                            ? `http://${p.IP || "0.0.0.0"}:${p.PublicPort}`
                            : null;
                        return url ? (
                          <a
                            key={`${p.Type}-${p.PrivatePort}-${p.PublicPort}`}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline mr-2 inline-flex items-center gap-1 cursor-pointer "
                          >
                            {p.IP}:{p.PublicPort}{" "}
                            <SquareArrowOutUpRight size={14} />
                          </a>
                        ) : (
                          <span
                            key={`${p.Type}-${p.PrivatePort}-${p.PublicPort}`}
                            className="mr-2"
                          >
                            {p.IP}:{p.PrivatePort}
                          </span>
                        );
                      })
                    ) : (
                      <span>-</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-left">{c.status}</td>
                  <td className="px-4 py-2 text-left">{c.owner}</td>
                  <td className="px-4 py-2 text-right">
                    {new Date(c.created * 1000).toLocaleString(undefined, {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",

                      hour12: false, // 24h format
                    })}
                  </td>
                </tr>
              ))}
              {containers.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-gray-500">
                    No containers found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
