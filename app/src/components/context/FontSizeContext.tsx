// FontSizeContext.tsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

interface FontSizeContextType {
  fontSize: number;
  increaseFont: () => void;
  decreaseFont: () => void;
}

const FontSizeContext = createContext<FontSizeContextType | undefined>(
  undefined
);

export const FontSizeProvider = ({ children }: { children: ReactNode }) => {
  const [fontSize, setFontSize] = useState<number>(() => {
    const stored = localStorage.getItem("fontSize");
    return stored ? parseInt(stored, 10) : 16;
  });

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}px`;
    localStorage.setItem("fontSize", fontSize.toString());
  }, [fontSize]);

  const increaseFont = () => setFontSize((prev) => Math.min(prev + 2, 24));
  const decreaseFont = () => setFontSize((prev) => Math.max(prev - 2, 12));

  return (
    <FontSizeContext.Provider value={{ fontSize, increaseFont, decreaseFont }}>
      {children}
    </FontSizeContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useFontSize = () => {
  const context = useContext(FontSizeContext);
  if (!context)
    throw new Error("useFontSize must be used within FontSizeProvider");
  return context;
};
