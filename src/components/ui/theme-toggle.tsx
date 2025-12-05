import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../hooks/use-theme.ts";
import { Button } from "./button.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select.tsx";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip.tsx";

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
  size = "icon",
  className,
}: ThemeToggleProps) {
  const { theme, setTheme, isDark } = useTheme();

  if (variant === "select") {
    return (
      <Select value={theme} onValueChange={(value) => setTheme(value as "light" | "dark" | "system")}>
        <SelectTrigger className={className}>
          <SelectValue placeholder="Theme" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="light">
            <div className="flex items-center gap-2">
              <Sun size={14} />
              Light
            </div>
          </SelectItem>
          <SelectItem value="dark">
            <div className="flex items-center gap-2">
              <Moon size={14} />
              Dark
            </div>
          </SelectItem>
          <SelectItem value="system">
            <div className="flex items-center gap-2">
              <span className="text-sm">💻</span>
              System
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size={size}
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className={className}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDark ? (
              <Sun className="h-[1.2rem] w-[1.2rem]" />
            ) : (
              <Moon className="h-[1.2rem] w-[1.2rem]" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isDark ? "Switch to light mode" : "Switch to dark mode"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
