import {
  Moon,
  Sun,
  Bell,
  Settings,
  LogOut,
  ChevronDown,
  ArrowRightLeft,
} from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipTrigger } from "@/components/ui/tooltip";
import { useSidebar } from "@/components/context/SidebarContext";
import { useFontSize } from "@/components/context/FontSizeContext";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const Header: React.FC<HeaderProps> = ({ isDarkMode, toggleDarkMode }) => {
  const { isSidebarCollapsed, setIsSidebarCollapsed } = useSidebar();
  const { increaseFont, decreaseFont } = useFontSize();
  const navigate = useNavigate();

  const toggleSidebar = () => setIsSidebarCollapsed((prev) => !prev);

  // Get user info from localStorage
  const [user, setUser] = React.useState(() => {
    const stored = localStorage.getItem("user");
    return stored
      ? JSON.parse(stored)
      : {
          name: "Guest",
          email: "guest@example.com",
          avatar:
            "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png",
        };
  });

  // Update user state on login/logout
  React.useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
    else
      setUser({
        name: "Guest",
        email: "guest@example.com",
        avatar:
          "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png",
      });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("user");
    setUser({
      name: "Guest",
      email: "guest@example.com",
      avatar:
        "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png",
    });
    navigate("/login");
  };

  return (
    <header className="rounded-md flex items-center w-full justify-between px-3 py-1 bg-white/85 shadow backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:bg-gray-800/95">
      {/* Left: Collapse + Title */}
      <div className="flex items-center space-x-4 dark:text-gray-100">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="cursor-pointer"
              variant="outline"
              size="icon"
              onClick={toggleSidebar}
            >
              <ArrowRightLeft
                className={cn(
                  "h-5 w-5 transition-transform duration-200 dark:text-gray-100",
                  !isSidebarCollapsed ? "rotate-0" : "rotate-180"
                )}
              />
            </Button>
          </TooltipTrigger>
        </Tooltip>
        <span className="font-semibold dark:text-gray-100">Dashboard</span>
      </div>

      {/* Right: Font size buttons + Dark mode + Notifications + User */}
      <div className="flex items-center gap-2">
        {/* Font size */}
        <div className="flex items-center gap-1 dark:text-gray-100 cursor-pointer">
          <Button
            className="cursor-pointer"
            size="icon"
            variant="outline"
            onClick={decreaseFont}
          >
            A-
          </Button>
          <Button
            className="cursor-pointer"
            size="icon"
            variant="outline"
            onClick={increaseFont}
          >
            A+
          </Button>
        </div>

        {/* Dark mode toggle */}
        <Button
          className="text-muted-foreground"
          variant="outline"
          size="icon"
          onClick={toggleDarkMode}
        >
          {isDarkMode ? (
            <Sun className="h-5 w-5 text-gray-100" />
          ) : (
            <Moon className="h-5 w-5 " />
          )}
        </Button>

        {/* Notifications */}
        <Button
          className="relative text-muted-foreground"
          variant="outline"
          size="icon"
        >
          <Bell className="h-5 w-5 dark:text-gray-100" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 rounded-full -mr-5"
            >
              <img
                src={user.avatar}
                alt="User Avatar"
                className="w-8 h-8 rounded-full"
              />
              <span className="sr-only">Open user menu</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56 border-0 mr-2 dark:bg-gray-900  dark:text-white"
            align="end"
            forceMount
          >
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;
