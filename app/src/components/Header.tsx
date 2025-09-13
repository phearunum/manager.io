import React, { useState } from "react";
import {
  ChevronLeft,
  Plus,
  Bell,
  Moon,
  Sun,
  ChevronDown,
  LogOut,
  Settings,
} from "lucide-react";

// Define the component props
interface HeaderProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({
  isDarkMode,
  toggleDarkMode,
  toggleSidebar,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const user = {
    name: "Abdul Aziz",
    avatar:
      "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png",
  };

  return (
    <header className="flex items-center justify-between p-1 bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
      {/* Left Section: Navigation and Title */}
      <div className="flex items-center space-x-4">
        {/* Collapse Icon */}
        <button
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 dark:bggray-900 p-2"
          onClick={toggleSidebar}
        >
          <ChevronLeft className="h-6 w-6 transform rotate-180" />
        </button>
        <span className="font-semibold text-gray-800 dark:text-gray-100">
          Dashboard
        </span>
      </div>

      {/* Right Section: Add Workspace, Icons, and Account Avatar */}
      <div className="flex items-center space-x-4">
        <button className="flex items-center space-x-2 py-2 px-4 rounded-lg text-white font-semibold bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 transition-colors shadow-lg">
          <Plus className="h-5 w-5" />
          <span>Add Workspace</span>
        </button>

        {/* Dark Mode Button with dynamic icon */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          {isDarkMode ? (
            <Sun className="h-6 w-6 text-yellow-400" />
          ) : (
            <Moon className="h-6 w-6 text-gray-500" />
          )}
        </button>

        {/* Notifications Icon with red dot */}
        <button className="relative p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
          <Bell className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
        </button>

        {/* Account Avatar with Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center space-x-2 cursor-pointer focus:outline-none"
          >
            <img
              src={user.avatar}
              alt="User Avatar"
              className="w-10 h-10 rounded-full"
            />
            <ChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400 transform transition-transform duration-200" />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl py-2 z-50 border border-gray-200 dark:border-gray-700">
              <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                <span className="block font-semibold text-gray-800 dark:text-gray-200">
                  {user.name}
                </span>
                <span className="block text-sm text-gray-500 dark:text-gray-400">
                  View Profile
                </span>
              </div>
              <a
                href="#"
                className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Settings className="h-5 w-5 mr-2" />
                Settings
              </a>
              <a
                href="#"
                className="flex items-center px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900 transition-colors"
              >
                <LogOut className="h-5 w-5 mr-2" />
                Sign Out
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
