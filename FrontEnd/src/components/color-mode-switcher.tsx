// FrontEnd/src/components/color-mode-switcher.tsx
"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

// Tipagem para aceitar className como propriedade
interface ColorModeSwitcherProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export function ColorModeSwitcher({ className, ...props }: ColorModeSwitcherProps) {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Previne erro de hidratação (SSR vs Client)
  if (!mounted) {
    return (
      <button disabled className={className} {...props}>
        <span className="sr-only">Carregando tema...</span>
      </button>
    );
  }

  function toggleTheme() {
    if (resolvedTheme === "dark") {
      setTheme("light");
    } else {
      setTheme("dark");
    }
  }

  return (
    <button
      onClick={toggleTheme}
      title="Alternar tema"
      // Se não passarem classe nenhuma, usa um flex padrão, mas permite sobrescrever
      className={className || "flex items-center gap-2 transition-colors"}
      {...props}
    >
      {resolvedTheme === "dark" ? (
        <Moon className="w-4 h-4 transition-all" />
      ) : (
        <Sun className="w-4 h-4 transition-all" />
      )}
      Alternar tema
    </button>
  );
}
