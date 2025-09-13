import React, { useState } from "react";
import sectionsData from "../data/menuItems.json";

// Define the shape of a single menu item
interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  notifications?: number;
}

// Define the shape of a collapsible section
interface SidebarSection {
  id: string;
  title: string;
  items: MenuItem[];
}

// Define the component props
interface SidebarProps {
  isSidebarCollapsed: boolean;
}

const sections: SidebarSection[] = sectionsData;

const user = {
  name: "Abdul Aziz",
  email: "Abdul@gmail.com",
  avatar:
    "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png",
};

const Sidebar: React.FC<SidebarProps> = ({ isSidebarCollapsed }) => {
  const [activeLink, setActiveLink] = useState<string>("dashboard");
  const [openSections, setOpenSections] = useState<Set<string>>(
    new Set(sections.map((s) => s.id))
  );

  const toggleSection = (sectionId: string) => {
    setOpenSections((prevOpenSections) => {
      const newOpenSections = new Set(prevOpenSections);
      if (newOpenSections.has(sectionId)) {
        newOpenSections.delete(sectionId);
      } else {
        newOpenSections.add(sectionId);
      }
      return newOpenSections;
    });
  };

  const renderMenuItem = (item: MenuItem) => (
    <li
      key={item.id}
      className={`
        flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors duration-200 mb-1
        ${
          activeLink === item.id
            ? "bg-purple-200 text-purple-800 dark:bg-purple-800 dark:text-white font-semibold"
            : "hover:bg-gray-200 dark:hover:bg-gray-700"
        }
      `}
      onClick={() => setActiveLink(item.id)}
    >
      <div className="flex items-center">
        {item.icon && <span className="mr-3 text-lg">{item.icon}</span>}
        <span>{item.label}</span>
      </div>
      {item.notifications !== undefined && (
        <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
          {item.notifications}
        </span>
      )}
    </li>
  );

  return (
    <aside
      className={`
        shadow 
        h-screen p-6 bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100 flex flex-col
        transition-all duration-300
        ${isSidebarCollapsed ? "w-20" : "w-72"}
        fixed left-0 top-0
      `}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div
          className={`flex items-center font-bold text-xl text-purple-700 dark:text-purple-300 transition-opacity duration-300 ${
            isSidebarCollapsed ? "opacity-0" : "opacity-100"
          }`}
        >
          <span className="bg-purple-700 text-white rounded-full w-8 h-8 flex items-center justify-center mr-2">
            G
          </span>{" "}
          Sensei
        </div>
        {isSidebarCollapsed && (
          <div className="flex items-center font-bold text-xl text-purple-700 dark:text-purple-300">
            <span className="bg-purple-700 text-white rounded-full w-8 h-8 flex items-center justify-center mr-2">
              G
            </span>
          </div>
        )}
      </div>

      {/* Menu Sections */}
      <div className="overflow-y-auto">
        {sections.map((section) => (
          <div key={section.id} className="mb-4">
            <div
              className={`flex items-center justify-between cursor-pointer ${
                isSidebarCollapsed ? "p-0 justify-center" : ""
              }`}
              onClick={() => toggleSection(section.id)}
            >
              <h3
                className={`text-gray-500 text-sm font-medium uppercase transition-opacity duration-300 ${
                  isSidebarCollapsed ? "opacity-0 h-0" : "opacity-100"
                }`}
              >
                {section.title}
              </h3>
              <span
                className={`transition-transform duration-200 ${
                  openSections.has(section.id) ? "rotate-90" : ""
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </span>
            </div>
            <ul
              className={`mt-2 ${
                openSections.has(section.id) ? "block" : "hidden"
              }`}
            >
              {section.items.map(renderMenuItem)}
            </ul>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-auto pt-6 border-t border-gray-300 dark:border-gray-700">
        {/* Progress Bar and Free Trial - Hidden when collapsed */}
        <div
          className={`bg-purple-600 text-white p-4 rounded-xl flex items-center justify-between mb-4 transition-opacity duration-300 ${
            isSidebarCollapsed ? "opacity-0 h-0" : "opacity-100 h-16"
          }`}
        >
          <span>20 / 30 Days</span>
          <div className="flex-grow h-1 bg-white/30 rounded-full mx-2">
            <div className="h-full w-2/3 bg-white rounded-full"></div>
          </div>
          <span className="bg-white text-purple-600 font-bold text-xs px-3 py-1 rounded-full">
            Free Trial
          </span>
        </div>
        <div className="flex items-center">
          <img
            src={user.avatar}
            alt="User Avatar"
            className="w-10 h-10 rounded-full mr-3"
          />
          <div
            className={`flex flex-col transition-opacity duration-300 ${
              isSidebarCollapsed ? "opacity-0 h-0" : "opacity-100"
            }`}
          >
            <span className="font-semibold text-gray-800 dark:text-gray-200">
              {user.name}
            </span>
            <span className="text-sm text-gray-500">{user.email}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
