"use client";

import * as React from "react";
import { LaptopMinimalIcon, MoonStarIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const themeOptions = [
  {
    value: "light",
    label: "Light",
    icon: SunIcon,
  },
  {
    value: "dark",
    label: "Dark",
    icon: MoonStarIcon,
  },
  {
    value: "system",
    label: "System",
    icon: LaptopMinimalIcon,
  },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const activeTheme = mounted ? theme ?? "system" : "system";
  const selectedOption =
    themeOptions.find((option) => option.value === activeTheme) ?? themeOptions[2];
  const SelectedIcon = selectedOption.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            aria-label="Change color theme"
            className="shrink-0"
          />
        }
      >
        <SelectedIcon data-icon="inline-start" />
        <span className="hidden sm:inline">Theme</span>
        <span className="sr-only sm:hidden">Theme</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Appearance</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={activeTheme} onValueChange={setTheme}>
            {themeOptions.map((option) => {
              const Icon = option.icon;

              return (
                <DropdownMenuRadioItem key={option.value} value={option.value}>
                  <Icon />
                  {option.label}
                </DropdownMenuRadioItem>
              );
            })}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
