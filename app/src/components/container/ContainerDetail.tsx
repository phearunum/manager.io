import React, { useEffect, useState, useRef } from "react";
import type { ContainerJSON, ContainerStats } from "@/type/docker";

import {
  inspectContainer,
  stateContainer,
  streamContainerLogs,
} from "@/services/docker.apt";
import ContainerStatsChart from "./ContainerStatsChart";

interface ContainerDetailModalProps {
  id: string;
  onClose: () => void;
}

export const ContainerDetailModal: React.FC<ContainerDetailModalProps> = ({
  id,
}) => {
  const [container, setContainer] = useState<ContainerJSON | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"detail" | "logs">("detail");
  const logRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState<ContainerStats | null>(null);

  // Fetch container details
  const fetchContainer = async () => {
    try {
      const res = await inspectContainer(id);
      setContainer(res.data);
    } catch (err) {
      console.error("Error fetching container details:", err);
    }
  };

  // Fetch container stats
  const fetchStats = async () => {
    try {
      const res = await stateContainer(id);
      setStats(res.data);
    } catch (err) {
      console.error("Error fetching container stats:", err);
    }
  };

  // Stream logs in real-time via SSE
  const streamLogs = () => {
    const es = streamContainerLogs(id);
    es.onmessage = (event) => {
      setLogs((prev) => [...prev, event.data]);
      logRef.current?.scrollTo({
        top: logRef.current.scrollHeight,
        behavior: "smooth",
      });
    };
    es.onerror = () => es.close();
    return () => es.close();
  };

  useEffect(() => {
    fetchContainer();
    fetchStats();
    const interval = setInterval(fetchStats, 5000); // refresh stats every 5s
    const closeLogs = streamLogs();
    logRef.current?.scrollTo({
      top: logRef.current.scrollHeight,
      behavior: "smooth",
    });
    return () => {
      clearInterval(interval);
      closeLogs();
    };
  }, [id]);

  return (
    <div className="p-0 inset-0 z-50 h-[90vh]">
      <div className="bg-white dark:bg-black overflow-hidden rounded-lg ">
        {/* Header */}
        <div className="flex justify-between items-center p-4 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
            Container Details: {container?.Name || id}
          </h2>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-600">
          {["detail", "logs"].map((tab) => (
            <button
              key={tab}
              className={`px-4 py-2 font-semibold  px-10 rounded-tl-xl rounded-tr-xl shadow  ${
                activeTab === tab
                  ? " dark:border-blue-400 text-blue-500 dark:text-blue-400 dark:bg-gray-600 bg-green-600/50 "
                  : "text-gray-500 dark:text-gray-400"
              }`}
              onClick={() => setActiveTab(tab as "detail" | "logs")}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="max-h-[80vh] h-[80vh] overflow-y-auto p-3">
          {container ? (
            <>
              {activeTab === "detail" && (
                <div className="space-y-4">
                  <div className="h-56">
                    {/* Stats Chart */}
                    {stats && <ContainerStatsChart stats={stats} />}
                  </div>
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-4 text-sm rounded-lg bg-gray-100 dark:bg-gray-900 p-4 -mt-5">
                    <div>
                      <p>
                        <span className="font-semibold">ID:</span>{" "}
                        {container.Id}
                      </p>
                      <p>
                        <span className="font-semibold">Image:</span>{" "}
                        {container.Image}
                      </p>
                      <p>
                        <span className="font-semibold">Platform:</span>{" "}
                        {container.Platform}
                      </p>
                      <p>
                        <span className="font-semibold">Log Path:</span>{" "}
                        {container.LogPath}
                      </p>
                      <p>
                        <span className="font-semibold">Driver:</span>{" "}
                        {container.GraphDriver?.Name}
                      </p>
                    </div>
                    <div>
                      <p>
                        <span className="font-semibold">State:</span>{" "}
                        {container.State?.Status}
                      </p>
                      <p>
                        <span className="font-semibold">Running:</span>{" "}
                        {container.State?.Running ? "Yes" : "No"}
                      </p>
                      <p>
                        <span className="font-semibold">Started At:</span>{" "}
                        {container.State?.StartedAt}
                      </p>
                      <p>
                        <span className="font-semibold">Finished At:</span>{" "}
                        {container.State?.FinishedAt}
                      </p>
                    </div>
                  </div>

                  {/* Config */}
                  {container.Config && (
                    <div>
                      <h3 className="font-semibold mt-4 mb-2 border-b border-gray-200">
                        Config
                      </h3>
                      <div className="text-sm bg-gray-100 dark:bg-gray-900 rounded-lg p-4">
                        <p>
                          <span className="font-semibold">Hostname:</span>{" "}
                          {container.Config.Hostname}
                        </p>
                        <p>
                          <span className="font-semibold">Env:</span>{" "}
                          {container.Config.Env?.join(", ")}
                        </p>
                        <p>
                          <span className="font-semibold">Cmd:</span>{" "}
                          {container.Config.Cmd?.join(" ")}
                        </p>
                        <p>
                          <span className="font-semibold">WorkingDir:</span>{" "}
                          {container.Config.WorkingDir}
                        </p>
                        <p>
                          <span className="font-semibold">Entrypoint:</span>{" "}
                          {container.Config.Entrypoint?.join(" ")}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Mounts */}
                  {container.Mounts?.length > 0 && (
                    <div>
                      <h3 className="font-semibold mt-4 mb-2 border-b border-gray-200">
                        Mounts
                      </h3>
                      <ul className="text-sm bg-gray-100 dark:bg-gray-900 rounded-lg p-2">
                        {container.Mounts.map((m, i) => (
                          <li key={i}>
                            {m.Source} → {m.Destination} ({m.Type},{" "}
                            {m.RW ? "RW" : "RO"})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Networks */}
                  {container.NetworkSettings?.Networks && (
                    <div>
                      <h3 className="font-semibold mt-4 mb-2 border-b border-gray-200">
                        Networks & Ports
                      </h3>

                      {Object.entries(container.NetworkSettings.Networks).map(
                        ([name, net]) => (
                          <div
                            key={name}
                            className="mt-2 text-sm bg-gray-100 dark:bg-gray-900 rounded-lg p-4"
                          >
                            <p className="font-semibold">{name} Network:</p>
                            <p>IP Address: {net.IPAddress}</p>
                            <p>MAC: {net.MacAddress}</p>
                            <p>Gateway: {net.Gateway}</p>
                            {net.Aliases && net.Aliases.length > 0 && (
                              <p>Aliases: {net.Aliases.join(", ")}</p>
                            )}
                            {container.NetworkSettings?.Ports &&
                              Object.keys(container.NetworkSettings.Ports)
                                .length > 0 && (
                                <div>
                                  <p className="font-semibold mt-1">
                                    Port Mappings:
                                  </p>
                                  {Object.entries(
                                    container.NetworkSettings.Ports
                                  ).map(([port, bindings]) => (
                                    <p key={port}>
                                      {port} →{" "}
                                      {bindings
                                        ?.map((b) => b.HostPort)
                                        .join(", ")}
                                    </p>
                                  ))}
                                </div>
                              )}
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "logs" && (
                <div
                  ref={logRef}
                  className="dark:bg-black dark:text-gray-200 text-sm p-3 rounded h-64 overflow-y-auto font-mono min-h-[80vh] max-h-[80vh]"
                >
                  {logs.map((line, i) => {
                    // Detect stderr vs stdout (simple check)
                    const isErr =
                      line.toLowerCase().includes("error") ||
                      line.toLowerCase().includes("stderr");

                    return (
                      <div
                        key={i}
                        className={
                          isErr
                            ? "text-red-500"
                            : "text-gray-800 dark:text-gray-200"
                        }
                      >
                        {line}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">
              Loading container details...
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
