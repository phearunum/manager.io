// hooks/sidebar-provider.tsx
import React, { createContext, useState, useEffect } from "react";

interface SidebarContextType {
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  toggleSidebar: () => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const SidebarContext = createContext<SidebarContextType | undefined>(
  undefined
);

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    const storedState = localStorage.getItem("isSidebarCollapsed");
    return storedState === "true";
  });

  useEffect(() => {
    localStorage.setItem("isSidebarCollapsed", String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  return (
    <SidebarContext.Provider
      value={{ isSidebarCollapsed, setIsSidebarCollapsed, toggleSidebar }}
    >
      {children}
    </SidebarContext.Provider>
  );
};
