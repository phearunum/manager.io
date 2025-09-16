// ContainerStatsChart.tsx
import React from "react";
import RadialStatChart from "./RadialStatChart";

export interface ContainerStats {
  cpu: { percent: number };
  memory: { usage: number; limit: number; percent: number };
  network: { rx_bytes: number; tx_bytes: number };
}

interface ContainerStatsChartProps {
  stats: ContainerStats;
}

const ContainerStatsChart: React.FC<ContainerStatsChartProps> = ({ stats }) => {
  const cpuPercent = parseFloat((stats.cpu.percent * 100).toFixed(1));
  const memoryPercent = parseFloat(
    ((stats.memory.usage / stats.memory.limit) * 100).toFixed(1)
  );
  const networkRxKB = parseFloat((stats.network.rx_bytes / 1024).toFixed(1));
  const networkTxKB = parseFloat((stats.network.tx_bytes / 1024).toFixed(1));

  return (
    <div className="grid grid-cols-4 gap-6">
      <RadialStatChart
        label="CPU Usage"
        value={cpuPercent}
        color="#0088FE"
        unit="%"
      />
      <RadialStatChart
        label="Memory Usage"
        value={memoryPercent}
        color="#00C49F"
        unit="%"
      />
      <RadialStatChart
        label="Network RX"
        value={networkRxKB}
        color="#FFBB28"
        unit="KB"
      />
      <RadialStatChart
        label="Network TX"
        value={networkTxKB}
        color="#FF8042"
        unit="KB"
      />
    </div>
  );
};

export default ContainerStatsChart;
