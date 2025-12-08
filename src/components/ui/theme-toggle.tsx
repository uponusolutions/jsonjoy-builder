import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../hooks/use-theme.ts";
import { Select, Tooltip, ActionIcon } from "@mantine/core";

export interface ThemeToggleProps {
  /** Show a simple toggle button instead of a dropdown */
  variant?: "toggle" | "select";
  /** Size of the button */
  size?: "sm" | "default" | "lg" | "icon";
  /** Additional class names */
  className?: string;
}

export function ThemeToggle({
  variant = "toggle",
  size = "default",
  className,
}: ThemeToggleProps) {
  const { theme, setTheme, isDark } = useTheme();

  if (variant === "select") {
    return (
      <Select
        value={theme}
        onChange={(value) => setTheme(value as "light" | "dark" | "system")}
        className={className}
        data={[
          { value: "light", label: "Light" },
          { value: "dark", label: "Dark" },
          { value: "system", label: "System" },
        ]}
        leftSection={isDark ? <Moon size={14} /> : <Sun size={14} />}
      />
    );
  }

  const mapSize = (s: string) => {
    if (s === "default") return "lg";
    if (s === "icon") return "lg";
    return s;
  };

  return (
    <Tooltip label={isDark ? "Switch to light mode" : "Switch to dark mode"}>
      <ActionIcon
        variant="default"
        size={mapSize(size)}
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className={className}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDark ? <Sun size="1.2rem" /> : <Moon size="1.2rem" />}
      </ActionIcon>
    </Tooltip>
  );
}
