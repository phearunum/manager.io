import React, { useEffect, useState } from "react";
import ReactApexChart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";

interface RadialStatChartProps {
  label: string;
  value: number;
  color?: string;
  unit?: string;
}

const RadialStatChart: React.FC<RadialStatChartProps> = ({
  label,
  value,
  color = "#010202",
  unit = "%",
}) => {
  const [series, setSeries] = useState<number[]>([value]);

  useEffect(() => {
    setSeries([value]);
  }, [value]);

  const chartOptions: ApexOptions = {
    chart: {
      type: "radialBar",
      height: 192,
      offsetY: 0, // move chart up
    },
    plotOptions: {
      radialBar: {
        startAngle: -135,
        endAngle: 135,
        hollow: { size: "50%" },
        track: { background: "#e5e7eb" }, // optional light gray track
        dataLabels: {
          name: {
            show: true,
            fontSize: "14px",
            color: "#6b7280",
            offsetY: 0, // move label inside
          },
          value: {
            show: true,
            fontSize: "18px",
            color: "#07a446ff",
            offsetY: 10, // small offset for value
            formatter: (val: number) => `${val.toFixed(1)}${unit}`,
          },
        },
      },
    },
    fill: {
      type: "gradient",
      gradient: {
        shade: "dark",
        type: "horizontal",
        shadeIntensity: 0.5,
        gradientToColors: [color],
        inverseColors: false,
        opacityFrom: 1,
        opacityTo: 1,
        stops: [0, 100],
      },
    },
    stroke: { dashArray: 4 },
    labels: [label],
  };

  return (
    <div className="w-56 h-56">
      <ReactApexChart
        options={chartOptions}
        series={series}
        type="radialBar"
        height={192}
      />
    </div>
  );
};

export default RadialStatChart;
