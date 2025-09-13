import React from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

const DashboardLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar isSidebarCollapsed={false} />
      <div className="flex-1 flex flex-col">
        <Header
          isDarkMode={false}
          toggleDarkMode={function (): void {
            throw new Error("Function not implemented.");
          }}
          toggleSidebar={function (): void {
            throw new Error("Function not implemented.");
          }}
        />
        <main className="flex-1 p-6">
          {/* Main content of your dashboard goes here */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
              Your Dashboard Content
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              This is where your charts, tables, and other dashboard widgets
              will be displayed.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
