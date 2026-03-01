import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";

export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  const isDark = theme === "dark";

  return (
    <button
      id="theme-toggle"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      className="relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110"
      style={{
        background: isDark
          ? "hsl(var(--muted) / 0.4)"
          : "hsl(var(--muted) / 0.8)",
        border: "1px solid hsl(var(--border))",
        boxShadow: isDark
          ? "0 0 12px hsl(185 95% 55% / 0.15)"
          : "0 1px 4px hsl(222 20% 10% / 0.1)",
      }}
    >
      {/* Sun icon — shown in light mode */}
      <Sun
        className="absolute h-4 w-4 transition-all duration-300"
        style={{
          opacity: isDark ? 0 : 1,
          transform: isDark ? "rotate(90deg) scale(0)" : "rotate(0deg) scale(1)",
          color: isDark ? "hsl(38 98% 58%)" : "hsl(38 80% 35%)",
        }}
      />
      {/* Moon icon — shown in dark mode */}
      <Moon
        className="absolute h-4 w-4 transition-all duration-300"
        style={{
          opacity: isDark ? 1 : 0,
          transform: isDark ? "rotate(0deg) scale(1)" : "rotate(-90deg) scale(0)",
          color: "hsl(185 95% 65%)",
        }}
      />
    </button>
  );
};