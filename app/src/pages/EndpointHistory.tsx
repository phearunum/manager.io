import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";
import { getEndpointHistory, type HealthHistory } from "@/services/docker.apt";
import { FaArrowLeft } from "react-icons/fa";

// --- Configuration Constants for Clean Light Style ---
// UP/HEALTHY COLORS (+1) 🟢
const LINE_COLOR_STATUS_UP = "rgba(1, 255, 60, 0.62)"; // Dark Green Line
const FILL_COLOR_STATUS_UP = "rgba(40, 167, 69, 0.25)"; // Light Green Fill

// DOWN/UNHEALTHY COLORS (-1) 🔴
const LINE_COLOR_STATUS_DOWN = "rgba(220, 53, 69, 1)"; // Dark Red Line
const FILL_COLOR_STATUS_DOWN = "rgba(255, 0, 25, 0.63)"; // Semi-Opaque Red Fill

// LATENCY COLORS 🔵
const LINE_COLOR_LATENCY = "rgba(14, 142, 226, 1)";

const TEXT_COLOR = "#4b5563"; // Dark text color

// Y-Axis Tick Formatter for Health Status
const healthStatusFormatter = (value: number) => {
  if (value === 1) return "UP";
  if (value === -1) return "DOWN";
  return "";
};

const convertLatencyToMs = (
  latencyValue: string | number | undefined
): number => {
  if (typeof latencyValue === "number") {
    return latencyValue / 1_000_000;
  }
  if (typeof latencyValue === "string") {
    const match = latencyValue.match(/(\d+\.?\d*)([a-z]+)/);
    if (match) {
      const value = parseFloat(match[1]);
      const unit = match[2];
      switch (unit) {
        case "ns":
          return value / 1000000;
        case "us":
          return value / 1000;
        case "ms":
          return value;
        case "s":
          return value * 1000;
      }
    }
  }
  return 0;
};

const EndpointHistory: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [historyData, setHistoryData] = useState<HealthHistory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const loadHistory = async () => {
      try {
        const data = await getEndpointHistory(id);
        setHistoryData(
          data.sort(
            (a, b) =>
              new Date(a.checkedAt).getTime() - new Date(b.checkedAt).getTime()
          )
        );
      } catch (err) {
        setError("Failed to load health history.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [id]);

  // Data processing for Recharts
  const chartData = React.useMemo(() => {
    return historyData.map((record) => {
      const latencyMs = convertLatencyToMs(record.Latency);

      // Binary status: UP (+1) or DOWN (-1)
      const statusValue = record.isHealthy == true ? 1 : -1;

      return {
        timeLabel: new Date(record.checkedAt).toLocaleString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: statusValue,
        latency: latencyMs,
      };
    });
  }, [historyData]);

  // Custom Tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const statusPayload = payload.find((p: any) => p.dataKey === "status");
      const status = statusPayload ? statusPayload.payload.status : undefined;

      const latencyPayload = payload.find((p: any) => p.dataKey === "latency");
      const latency = latencyPayload ? latencyPayload.value : undefined;

      let statusColor = TEXT_COLOR;
      let statusText = "UNKNOWN";

      if (status === 1) {
        statusColor = LINE_COLOR_STATUS_UP;
        statusText = "UP";
      } else if (status === -1) {
        statusColor = LINE_COLOR_STATUS_DOWN;
        statusText = "DOWN";
      }

      return (
        <div className="bg-white p-3 border border-gray-300  rounded text-sm text-gray-800">
          <p className="font-semibold text-gray-600 mb-1">{label}</p>
          {status !== undefined && (
            <p>
              <span className="font-bold mr-2" style={{ color: statusColor }}>
                Status:
              </span>
              {statusText}
            </p>
          )}
          {latency !== undefined && (
            <p>
              <span
                className="font-bold mr-2"
                style={{ color: LINE_COLOR_LATENCY }}
              >
                Latency:
              </span>
              {latency.toFixed(1)}ms
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  if (loading)
    return (
      <div className="p-8 text-lg text-gray-700">Loading history data...</div>
    );
  if (error)
    return (
      <div className="p-8 text-lg text-red-600 border border-red-300 bg-red-50 rounded-lg">
        {error}
      </div>
    );

  return (
    // Light Theme Tailwind Classes
    <div className="p-2 bg-gray-50 min-h-screen">
      <button
        onClick={() => navigate("/backends")}
        className="inline-flex items-center px-4 py-2 mb-6 text-sm font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-100 border border-gray-300 shadow-sm transition"
      >
        <FaArrowLeft className="mr-2" />
        Back to Endpoints List
      </button>

      {/* Synchronized Charts Wrapper */}
      <div className="bg-white  rounded-xl p-6">
        <h2
          className="text-xl font-bold mb-6 text-center"
          style={{ color: TEXT_COLOR }}
        >
          Endpoint History (Synchronized View)
        </h2>

        {chartData.length === 0 ? (
          <p className="text-gray-500 text-center py-10 text-lg">
            No health history records found for this endpoint yet.
          </p>
        ) : (
          <div className="space-y-10">
            {/* 1. TOP CHART: HEALTH STATUS (Rounded Line, Split Area Coloring) */}
            <div className="h-[200px] w-full">
              <h3
                className="text-md font-semibold mb-2"
                style={{ color: TEXT_COLOR }}
              >
                Health Status
              </h3>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={chartData}
                  syncId="endpointSync"
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
                    vertical={false}
                  />

                  {/* X-Axis (Time) - Hidden on the top chart */}
                  <XAxis dataKey="timeLabel" tick={{ fill: TEXT_COLOR }} hide />

                  {/* 🛑 Y-Axis Domain adjusted to allow for curve overshoot */}
                  <YAxis
                    dataKey="status"
                    domain={[-1.1, 1.1]}
                    ticks={[-1, 1]}
                    tickFormatter={healthStatusFormatter}
                    tick={{ fill: TEXT_COLOR }}
                    width={50}
                  />

                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="status"
                    baseValue={1}
                    fill={FILL_COLOR_STATUS_DOWN}
                    stroke={LINE_COLOR_STATUS_DOWN}
                    strokeWidth={2}
                    fillOpacity={1}
                    dot={false}
                    isAnimationActive={false}
                  />

                  <Area
                    type="monotone"
                    dataKey="status"
                    baseValue={-1}
                    fill={FILL_COLOR_STATUS_UP}
                    stroke={LINE_COLOR_STATUS_UP}
                    strokeWidth={2}
                    fillOpacity={1}
                    dot={false}
                    isAnimationActive={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EndpointHistory;
