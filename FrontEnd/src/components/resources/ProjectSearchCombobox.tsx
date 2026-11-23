// src/components/resources/ProjectSearchCombobox.tsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Loader2, Search, X } from "lucide-react";
import type { IOrganizationProjectOption } from "@/lib/hooks/useOrganizationProjects";

const MAX_VISIBLE_RESULTS = 10;

interface ProjectSearchComboboxProps {
  id: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  projects: IOrganizationProjectOption[];
  selectedProjectId: string;
  onSelectProject: (projectId: string) => void;
  onDropdownOpenChange?: (isOpen: boolean) => void;
  disabled?: boolean;
  isLoading?: boolean;
  hasError?: boolean;
  errorDescribedBy?: string;
  resetSignal?: number;
}

interface INormalizedProjectOption {
  id: string;
  title: string;
  referenceCode: string;
  normalizedTitle: string;
  normalizedRefCode: string;
}

interface IDropdownPosition {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
  maxHeight: number;
}

function normalizeSearchText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Combobox pesquisável para seleção dinâmica de projeto em memória (disparo com 2+ caracteres).
 */
export function ProjectSearchCombobox({
  id,
  inputRef,
  projects,
  selectedProjectId,
  onSelectProject,
  onDropdownOpenChange,
  disabled = false,
  isLoading = false,
  hasError = false,
  errorDescribedBy,
  resetSignal = 0,
}: ProjectSearchComboboxProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [dropdownPosition, setDropdownPosition] =
    useState<IDropdownPosition | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputWrapperRef = useRef<HTMLDivElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);
  const internalInputRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<Record<string, HTMLLIElement | null>>({});
  const prevSelectedIdRef = useRef(selectedProjectId);
  const clearedByInputRef = useRef(false);

  const resolvedInputRef = inputRef ?? internalInputRef;

  const normalizedProjects = useMemo<INormalizedProjectOption[]>(() => {
    return projects.reduce<INormalizedProjectOption[]>((acc, proj) => {
      const projId = String(proj._id || proj.id || "").trim();
      if (!projId) return acc;

      const title = proj.title?.trim() || "Projeto sem título";
      const refCode = proj.referenceCode?.trim() || "";

      acc.push({
        id: projId,
        title,
        referenceCode: refCode,
        normalizedTitle: normalizeSearchText(title),
        normalizedRefCode: normalizeSearchText(refCode),
      });
      return acc;
    }, []);
  }, [projects]);

  useEffect(() => {
    setSearchQuery("");
    setIsOpen(false);
    setActiveIndex(0);
  }, [resetSignal]);

  useEffect(() => {
    const prevSelectedId = prevSelectedIdRef.current;
    prevSelectedIdRef.current = selectedProjectId;
    const wasClearedByInput = clearedByInputRef.current;
    clearedByInputRef.current = false;

    if (selectedProjectId) {
      const matched = normalizedProjects.find((p) => p.id === selectedProjectId);
      if (matched) {
        setSearchQuery(matched.title);
      }
      return;
    }

    if (prevSelectedId && !wasClearedByInput) {
      setSearchQuery("");
      setIsOpen(false);
    }
  }, [selectedProjectId, normalizedProjects]);

  const trimmedQuery = searchQuery.trim();
  const normalizedQuery = useMemo(
    () => normalizeSearchText(trimmedQuery),
    [trimmedQuery]
  );

  const filteredProjects = useMemo<INormalizedProjectOption[]>(() => {
    if (trimmedQuery.length < 2 || !normalizedQuery) {
      return [];
    }

    const matches = normalizedProjects.filter(
      (item) =>
        item.normalizedTitle.includes(normalizedQuery) ||
        (item.normalizedRefCode !== "" &&
          item.normalizedRefCode.includes(normalizedQuery))
    );

    const getMatchRank = (item: INormalizedProjectOption): number => {
      if (item.normalizedTitle.startsWith(normalizedQuery)) return 0;
      if (
        item.normalizedRefCode !== "" &&
        item.normalizedRefCode.startsWith(normalizedQuery)
      ) {
        return 1;
      }
      if (item.normalizedTitle.includes(normalizedQuery)) return 2;
      return 3;
    };

    return matches.sort((a, b) => {
      const rankDiff = getMatchRank(a) - getMatchRank(b);
      if (rankDiff !== 0) return rankDiff;
      return a.title.localeCompare(b.title, "pt-BR");
    });
  }, [normalizedProjects, trimmedQuery.length, normalizedQuery]);

  const shouldShowPopover = isOpen && !disabled && trimmedQuery.length >= 1;
  const hasMinChars = trimmedQuery.length >= 2;
  const isSelectedProjectMissing =
    Boolean(selectedProjectId) &&
    !isLoading &&
    normalizedProjects.length > 0 &&
    !normalizedProjects.some((p) => p.id === selectedProjectId);
  const visibleProjects = useMemo(
    () => filteredProjects.slice(0, MAX_VISIBLE_RESULTS),
    [filteredProjects]
  );

  const updateDropdownPosition = useCallback(() => {
    const wrapper = inputWrapperRef.current;
    if (!wrapper) return;

    const rect = wrapper.getBoundingClientRect();
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;

    if (rect.bottom < 0 || rect.top > viewportHeight) {
      setIsOpen(false);
      return;
    }

    let parent: HTMLElement | null = wrapper.parentElement;
    while (parent && parent !== document.body) {
      const style = window.getComputedStyle(parent);
      if (style.overflowY === "auto" || style.overflowY === "scroll") {
        const parentRect = parent.getBoundingClientRect();
        if (rect.bottom < parentRect.top || rect.top > parentRect.bottom) {
          setIsOpen(false);
          return;
        }
        break;
      }
      parent = parent.parentElement;
    }

    const spaceBelow = viewportHeight - rect.bottom - 8;
    const spaceAbove = rect.top - 8;
    const openAbove = spaceBelow < 180 && spaceAbove > spaceBelow;
    const availableSpace = openAbove ? spaceAbove : spaceBelow;
    const maxHeight = Math.min(224, Math.max(64, Math.floor(availableSpace)));

    setDropdownPosition({
      top: openAbove ? undefined : rect.bottom + 4,
      bottom: openAbove ? viewportHeight - rect.top + 4 : undefined,
      left: rect.left,
      width: rect.width,
      maxHeight,
    });
  }, []);

  useEffect(() => {
    onDropdownOpenChange?.(shouldShowPopover);
  }, [shouldShowPopover, onDropdownOpenChange]);

  useEffect(() => {
    if (!shouldShowPopover) {
      setDropdownPosition(null);
      return;
    }

    updateDropdownPosition();

    window.addEventListener("scroll", updateDropdownPosition, true);
    window.addEventListener("resize", updateDropdownPosition);

    return () => {
      window.removeEventListener("scroll", updateDropdownPosition, true);
      window.removeEventListener("resize", updateDropdownPosition);
    };
  }, [shouldShowPopover, updateDropdownPosition]);

  useEffect(() => {
    if (!shouldShowPopover) return;

    const handleMouseDownOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        !containerRef.current?.contains(target) &&
        !listboxRef.current?.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleMouseDownOutside);
    return () => {
      document.removeEventListener("mousedown", handleMouseDownOutside);
    };
  }, [shouldShowPopover]);

  useEffect(() => {
    if (visibleProjects.length === 0) {
      setActiveIndex(-1);
      return;
    }
    setActiveIndex((prev) =>
      prev >= 0 && prev < visibleProjects.length ? prev : 0
    );
  }, [visibleProjects]);

  useEffect(() => {
    if (!shouldShowPopover || !hasMinChars || activeIndex < 0) return;
    const activeItem = visibleProjects[activeIndex];
    if (!activeItem) return;
    optionRefs.current[activeItem.id]?.scrollIntoView({ block: "nearest" });
  }, [shouldShowPopover, hasMinChars, activeIndex, visibleProjects]);

  const activeOption =
    shouldShowPopover &&
    hasMinChars &&
    activeIndex >= 0 &&
    activeIndex < visibleProjects.length
      ? visibleProjects[activeIndex]
      : null;

  const listboxId = `${id}-listbox`;
  const placeholderText = isLoading
    ? "Carregando projetos..."
    : normalizedProjects.length === 0
      ? "Nenhum projeto disponível"
      : "Digite ao menos 2 caracteres do projeto...";

  const handleSelectOption = (item: INormalizedProjectOption) => {
    onSelectProject(item.id);
    setSearchQuery(item.title);
    setIsOpen(false);
    setActiveIndex(0);
  };

  const handleClear = () => {
    setSearchQuery("");
    if (selectedProjectId) {
      onSelectProject("");
    }
    setIsOpen(false);
    setActiveIndex(0);
    resolvedInputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = e.target.value;
    setSearchQuery(nextValue);
    if (selectedProjectId) {
      clearedByInputRef.current = true;
      onSelectProject("");
    }
    setIsOpen(true);
    setActiveIndex(0);
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (selectedProjectId) {
      e.currentTarget.select();
      return;
    }
    if (searchQuery.trim().length >= 1) {
      setIsOpen(true);
    }
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const nextFocus = e.relatedTarget as Node | null;
    if (
      !nextFocus ||
      (!containerRef.current?.contains(nextFocus) &&
        !listboxRef.current?.contains(nextFocus))
    ) {
      setIsOpen(false);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === "ArrowDown") {
      if (!shouldShowPopover) {
        if (trimmedQuery.length >= 1) {
          e.preventDefault();
          setIsOpen(true);
          setActiveIndex(0);
        }
        return;
      }
      if (hasMinChars && visibleProjects.length > 0) {
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % visibleProjects.length);
      }
      return;
    }

    if (e.key === "ArrowUp") {
      if (shouldShowPopover && hasMinChars && visibleProjects.length > 0) {
        e.preventDefault();
        setActiveIndex((prev) =>
          prev <= 0 ? visibleProjects.length - 1 : prev - 1
        );
      }
      return;
    }

    if (e.key === "Enter") {
      if (shouldShowPopover && hasMinChars && activeOption) {
        e.preventDefault();
        handleSelectOption(activeOption);
      }
      return;
    }

    if (e.key === "Escape") {
      if (shouldShowPopover) {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(false);
      }
    }
  };

  const popoverNode =
    shouldShowPopover && dropdownPosition ? (
      <ul
        ref={listboxRef}
        id={listboxId}
        role="listbox"
        aria-label="Sugestões de projetos"
        onMouseDown={(e) => e.preventDefault()}
        style={{
          position: "fixed",
          top: dropdownPosition.top,
          bottom: dropdownPosition.bottom,
          left: dropdownPosition.left,
          width: dropdownPosition.width,
          maxHeight: dropdownPosition.maxHeight,
          zIndex: 70,
        }}
        className="overflow-y-auto rounded-md border border-border bg-card py-1 shadow-lg"
      >
        {isLoading && normalizedProjects.length === 0 ? (
          <li
            role="presentation"
            className="px-3 py-2.5 text-sm text-muted-foreground flex items-center gap-2"
          >
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            <span>Carregando projetos...</span>
          </li>
        ) : !isLoading && normalizedProjects.length === 0 ? (
          <li
            role="presentation"
            className="px-3 py-2.5 text-sm text-muted-foreground"
          >
            Nenhum projeto cadastrado na organização.
          </li>
        ) : !hasMinChars ? (
          <li
            role="presentation"
            className="px-3 py-2.5 text-sm text-muted-foreground"
          >
            Digite mais 1 caractere para buscar projetos...
          </li>
        ) : filteredProjects.length === 0 ? (
          <li
            role="presentation"
            className="px-3 py-2.5 text-sm text-muted-foreground"
          >
            Nenhum projeto encontrado para &ldquo;{trimmedQuery}&rdquo;.
          </li>
        ) : (
          <>
            <li
              role="presentation"
              className="px-3 py-1.5 text-xs text-muted-foreground border-b border-border"
            >
              {filteredProjects.length > MAX_VISIBLE_RESULTS
                ? `Mostrando ${MAX_VISIBLE_RESULTS} de ${filteredProjects.length} projetos — refine sua busca`
                : `${filteredProjects.length} ${
                    filteredProjects.length === 1
                      ? "projeto encontrado"
                      : "projetos encontrados"
                  }`}
            </li>
            {visibleProjects.map((item, index) => {
              const isSelected = item.id === selectedProjectId;
              const isActive = index === activeIndex;
              return (
                <li
                  key={item.id}
                  ref={(el) => {
                    optionRefs.current[item.id] = el;
                  }}
                  id={`${id}-option-${item.id}`}
                  role="option"
                  aria-selected={isSelected}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => handleSelectOption(item)}
                  className={`min-h-11 px-3 py-2 text-sm flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                    isSelected && isActive
                      ? "bg-primary-bg text-primary font-medium ring-1 ring-inset ring-primary/40"
                      : isSelected
                        ? "bg-primary-bg text-primary font-medium"
                        : isActive
                          ? "bg-muted text-foreground"
                          : "text-foreground hover:bg-muted"
                  }`}
                >
                  <span className="truncate">{item.title}</span>
                  <span className="flex items-center gap-2 shrink-0 max-w-[40%]">
                    {item.referenceCode && (
                      <span
                        className={`text-xs font-mono truncate ${
                          isSelected ? "text-primary" : "text-muted-foreground"
                        }`}
                      >
                        {item.referenceCode}
                      </span>
                    )}
                    {isSelected && <Check className="w-4 h-4 shrink-0" />}
                  </span>
                </li>
              );
            })}
          </>
        )}
      </ul>
    ) : null;

  return (
    <div ref={containerRef} className="relative">
      <div ref={inputWrapperRef} className="relative flex items-center">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-3 flex items-center text-muted-foreground"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </span>

        <input
          ref={resolvedInputRef}
          id={id}
          type="text"
          role="combobox"
          autoComplete="off"
          disabled={disabled}
          value={searchQuery}
          placeholder={placeholderText}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          aria-autocomplete="list"
          aria-expanded={shouldShowPopover}
          aria-controls={listboxId}
          aria-activedescendant={
            activeOption ? `${id}-option-${activeOption.id}` : undefined
          }
          aria-invalid={hasError}
          aria-describedby={errorDescribedBy}
          className={`w-full pl-9 ${
            searchQuery.length > 0 && !disabled ? "pr-11" : "pr-3"
          } min-h-11 text-sm border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 ${
            hasError ? "border-st-critical" : "border-input"
          }`}
        />

        {searchQuery.length > 0 && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Limpar busca de projeto"
            className="absolute right-0 inset-y-0 min-w-11 min-h-11 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isSelectedProjectMissing && (
        <p role="status" className="mt-1 text-xs text-muted-foreground">
          O projeto selecionado não está mais disponível na lista.
        </p>
      )}

      {typeof document !== "undefined" && popoverNode
        ? createPortal(popoverNode, document.body)
        : null}
    </div>
  );
}
