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
  const [theme, setTheme] = useState(defaultTheme);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const root = window.document.documentElement;
      root.classList.remove("light", "dark");

      if (enableSystem) {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
          .matches
          ? "dark"
          : "light";
        const savedTheme = localStorage.getItem("theme") as
          | "light"
          | "dark"
          | null;
        const activeTheme = savedTheme || systemTheme;
        setTheme(activeTheme);
        root.classList.add(activeTheme);
      } else {
        root.classList.add(theme);
      }
    }
  }, [theme, enableSystem]);

  const handleSetTheme = (newTheme: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("theme", newTheme);
      const root = window.document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(newTheme);
      setTheme(newTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: handleSetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
