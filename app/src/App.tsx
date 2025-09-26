import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/context/SidebarContext";
import { FontSizeProvider } from "@/components/context/FontSizeContext";
import AppSidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import DashboardPage from "@/pages/dashboard-page";
import ProfilePage from "@/pages/ProfilePage";
import Home from "@/pages/Home";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/LoginPage";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { ThemeProvider } from "./components/ThemProvider";
import { cn } from "@/lib/utils";
import InspectContainer from "./pages/container-detail";
import ContainerImagePage from "./pages/container-image";
import EndPointList from "./pages/endpoint-list";
import EndpointHistory from "./pages/EndpointHistory";

// Query client
const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60 * 1000 } },
});

// Layout
const Layout: React.FC<{ isDarkMode: boolean; toggleDarkMode: () => void }> = ({
  isDarkMode,
  toggleDarkMode,
}) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div
      className={cn(
        "flex h-screen w-full transition-all dark:bg-black duration-300 p-1",
        isDarkMode ? "dark" : ""
      )}
    >
      <AppSidebar />
      <div
        className="flex flex-col flex-1 transition-all duration-300 p-1 w-full"
        style={{
          marginLeft: isSidebarCollapsed ? "0px" : "w-[auto]",
        }}
      >
        <Header isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
        <main className="w-full flex-1 overflow-auto dark:bg-black p-1 pt-2 m-[0] ">
          <Routes>
            <Route
              path="/endpoint"
              element={
                <ProtectedRoute>
                  <EndPointList />
                </ProtectedRoute>
              }
            />
            <Route path="/backends/:id/history" element={<EndpointHistory />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/container"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/container/v/:id"
              element={
                <ProtectedRoute>
                  <InspectContainer />
                </ProtectedRoute>
              }
            />
            <Route
              path="/container/images"
              element={
                <ProtectedRoute>
                  <ContainerImagePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

// App component
function App() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const storedTheme = localStorage.getItem("theme");
      if (storedTheme) return storedTheme === "dark";
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

  return (
    <BrowserRouter>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <FontSizeProvider>
              <SidebarProvider>
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  <Route
                    path="/*"
                    element={
                      <Layout
                        isDarkMode={isDarkMode}
                        toggleDarkMode={toggleDarkMode}
                      />
                    }
                  />
                </Routes>
              </SidebarProvider>
            </FontSizeProvider>
            <Toaster />
          </TooltipProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
