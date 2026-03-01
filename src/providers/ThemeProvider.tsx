import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface ThemeContextType {
  theme: string;
  setTheme: (theme: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: string;
  enableSystem?: boolean;
}

export const ThemeProvider = ({
  children,
  defaultTheme = "dark",
  enableSystem = true,
}: ThemeProviderProps) => {
  // Initialise from localStorage / system preference immediately so the
  // correct class is applied before the first paint.
  const [theme, setTheme] = useState<string>(() => {
    if (typeof window === "undefined") return defaultTheme;
    const saved = localStorage.getItem("theme") as "light" | "dark" | null;
    if (saved) return saved;
    if (enableSystem) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return defaultTheme;
  });

  // Keep <html> class in sync whenever theme changes.
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
  }, [theme]);

  const handleSetTheme = (newTheme: string) => {
    localStorage.setItem("theme", newTheme);
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
