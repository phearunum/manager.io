import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Home from "./pages/Home";

const App: React.FC = () => {
  // Initialize state from localStorage or default to false
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme === "dark";
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Use useEffect to apply the 'dark' class and save the theme to localStorage
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className={`flex min-h-screen`}>
      <Sidebar isSidebarCollapsed={isSidebarCollapsed} />
      <div
        className={`
          flex-1 flex flex-col 
          transition-all duration-300 
          ${isSidebarCollapsed ? "ml-20" : "ml-72"}
        `}
      >
        <Header
          isDarkMode={isDarkMode}
          toggleDarkMode={toggleDarkMode}
          toggleSidebar={toggleSidebar}
        />
        <main className="flex-1 p-6 bg-gray-100 dark:bg-gray-900">
          <Home />
        </main>
      </div>
    </div>
  );
};

export default App;
