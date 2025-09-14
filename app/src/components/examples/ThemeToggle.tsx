import { ThemeToggle } from "../ThemToggle";
import { ThemeProvider } from "../ThemProvider";

export default function ThemeToggleExample() {
  return (
    <ThemeProvider>
      <div className="p-6 flex items-center justify-center">
        <ThemeToggle />
      </div>
    </ThemeProvider>
  );
}
