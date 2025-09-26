import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSidebar } from "./context/SidebarContext";
import sectionsData from "../data/menuItems.json";
import * as LucideIcons from "lucide-react"; // import all icons

interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  color?: string;
  notifications?: number;
  route?: string;
  translateKey?: string;
}

interface SidebarSection {
  id: string;
  title: string;
  items: MenuItem[];
  hidden?: boolean;
}

interface SidebarProps {
  fontSize?: number;
}

const sections: SidebarSection[] = sectionsData;

const Sidebar: React.FC<SidebarProps> = ({ fontSize = 14 }) => {
  const { isSidebarCollapsed } = useSidebar();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [activeLink, setActiveLink] = useState<string>("dashboard");
  const [openSections, setOpenSections] = useState<Set<string>>(
    new Set(sections.map((s) => s.id))
  );

  const navigate = useNavigate();
  const location = useLocation();

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) => {
      const newSet = new Set(prev);
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      newSet.has(sectionId) ? newSet.delete(sectionId) : newSet.add(sectionId);
      return newSet;
    });
  };

  const handleMenuClick = (item: MenuItem) => {
    setActiveLink(item.id);
    if (item.route) navigate(item.route);
  };

  const renderMenuItem = (item: MenuItem) => {
    // Dynamic icon mapping
    const IconComponent = item.icon
      ? (LucideIcons as unknown)[item.icon]
      : null;

    return (
      <li
        key={item.id}
        className={`
          flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors duration-200 mb-1
          ${
            location.pathname === item.route
              ? "bg-blue-200/50 text-gray-800 dark:bg-gray-500/50 dark:text-white font-semibold"
              : "hover:bg-gray-200 dark:hover:bg-gray-700"
          }
        `}
        onClick={() => handleMenuClick(item)}
        title={item.translateKey || item.label}
      >
        <div className="flex items-center">
          {IconComponent && (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-200"
              // fallback blue-200
            >
              <IconComponent
                size={18}
                color={item.color || "#2563eb"} // fallback blue-600
              />
            </div>
          )}
          {!isSidebarCollapsed && <span className="ml-1">{item.label}</span>}
        </div>

        {!isSidebarCollapsed && item.notifications !== undefined && (
          <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
            {item.notifications}
          </span>
        )}
      </li>
    );
  };

  return (
    <aside
      className={`
        shadow rounded-md
        h-screen p-2 bg-white text-gray-800 dark:text-gray-100 flex flex-col
        m-1 -mb-1
        transition-all dark:bg-gray-800/85
        ${isSidebarCollapsed ? "hidden" : "w-[auto]"}
      `}
      style={{ fontSize: `${fontSize}px` }}
    >
      {/* Header */}
      <div className="mb-6 flex items-center justify-center">
        {isSidebarCollapsed ? (
          <span className="bg-blue-700 text-white rounded-full w-8 h-8 flex items-center justify-center">
            IM
          </span>
        ) : (
          <div className="flex items-center font-bold text-xl text-blue-700 dark:text-blue-500">
            <span className="bg-blue-700 text-white rounded-full w-10 h-10 flex items-center justify-center mr-2">
              IM
            </span>
            IManager
          </div>
        )}
      </div>

      {/* Menu Sections */}
      <div className="overflow-y-auto flex-1">
        {sections.map((section) => (
          <div key={section.id} className="mb-4">
            <div
              className={`flex items-center justify-between cursor-pointer ${
                isSidebarCollapsed ? "justify-center" : ""
              }`}
              onClick={() => toggleSection(section.id)}
            >
              {!isSidebarCollapsed && (
                <h3 className="text-gray-500 text-sm font-medium uppercase">
                  {section.title}
                </h3>
              )}
              {!isSidebarCollapsed && (
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
              )}
            </div>
            {!isSidebarCollapsed && (
              <ul
                className={`mt-2 ${
                  openSections.has(section.id) ? "block" : "hidden"
                }`}
              >
                {section.items.map(renderMenuItem)}
              </ul>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-auto pt-6 border-t border-gray-300 dark:border-gray-700">
        {!isSidebarCollapsed && (
          <>
            <div className="bg-purple-600 text-white p-4 rounded-xl flex items-center justify-between mb-4">
              <span>20 / 30 Days</span>
              <div className="flex-grow h-1 bg-white/30 rounded-full mx-2">
                <div className="h-full w-2/3 bg-white rounded-full"></div>
              </div>
              <span className="bg-white text-purple-600 font-bold text-xs px-3 py-1 rounded-full">
                Free Trial
              </span>
            </div>
          </>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
