import Header from "./Header";
import Sidebar from "./Sidebar";

// MainLayout.tsx
export const MainLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1">
        <Header
          isDarkMode={false}
          toggleDarkMode={function (): void {
            throw new Error("Function not implemented.");
          }}
        />
        <main className="p-4">{children}</main>
      </div>
    </div>
  );
};
