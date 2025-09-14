import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

interface SidebarContextType {
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  fontSize: number;
  setFontSize: React.Dispatch<React.SetStateAction<number>>;
  toggleSidebar: () => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const SidebarContext = createContext<SidebarContextType | undefined>(
  undefined
);

export const SidebarProvider = ({ children }: { children: ReactNode }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("isSidebarCollapsed") === "true";
    }
    return false;
  });

  const [fontSize, setFontSize] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("sidebarFontSize");
      return stored ? parseInt(stored, 10) : 16;
    }
    return 16;
  });

  // Persist states to localStorage
  useEffect(() => {
    localStorage.setItem("isSidebarCollapsed", String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  useEffect(() => {
    localStorage.setItem("sidebarFontSize", String(fontSize));
  }, [fontSize]);

  const toggleSidebar = () => setIsSidebarCollapsed((prev) => !prev);

  return (
    <SidebarContext.Provider
      value={{
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        fontSize,
        setFontSize,
        toggleSidebar,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context)
    throw new Error("useSidebar must be used within a SidebarProvider");
  return context;
};
