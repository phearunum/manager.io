import { ContainerList } from "./container/ContainerList";

interface DashboardProps {
  className?: string;
}

export function Dashboard({ className }: DashboardProps) {
  return (
    <div className={className}>
      <div className="w-full p-2 rounded-lg shadow h-screen bg-white dark:bg-gray-800">
        <div>
          {/* Header */}

          {/* Container list */}
          <ContainerList />
        </div>
      </div>
    </div>
  );
}
