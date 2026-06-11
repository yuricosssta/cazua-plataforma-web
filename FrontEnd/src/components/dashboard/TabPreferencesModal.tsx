//src/components/dashboard/TabPreferencesModal.tsx
"use client";

import React from "react";
import { X } from "lucide-react";
import { TabType } from "@/types/project";

interface TabOption {
  id: TabType;
  label: string;
}

interface TabPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableTabs: TabOption[];
  visibleTabs: string[];
  onToggleTab: (tabId: string) => void;
}

export function TabPreferencesModal({
  isOpen,
  onClose,
  availableTabs,
  visibleTabs,
  onToggleTab,
}: TabPreferencesModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-md shadow-sm w-full max-w-sm p-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-4 border-b border-border/50 pb-3">
          <div>
            <h2 className="text-lg font-bold text-card-foreground tracking-tight">Preferências de Visualização</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Selecione quais abas exibir no painel.</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2 py-2 max-h-[60vh] overflow-y-auto pr-1">
          {availableTabs.map((tab) => {
            const isChecked = visibleTabs.includes(tab.id);
            const isDisabled = isChecked && visibleTabs.length === 1; 

            return (
              <label
                key={tab.id}
                className={`flex items-center gap-3 p-2.5 rounded-md border transition-colors cursor-pointer ${
                  isChecked 
                    ? "border-primary/30 bg-primary/10" 
                    : "border-border bg-secondary hover:bg-secondary/80"
                } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  disabled={isDisabled}
                  onChange={() => onToggleTab(tab.id)}
                  className="w-4 h-4 rounded text-primary border-input focus:ring-ring focus:ring-offset-0 bg-background"
                />
                <span className="text-sm font-semibold text-foreground">{tab.label}</span>
              </label>
            );
          })}
        </div>

        <div className="mt-5 pt-3 border-t border-border/50 flex justify-end">
          <button
            onClick={onClose}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md shadow-sm hover:bg-primary/90 transition-colors text-sm font-semibold w-full"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
}