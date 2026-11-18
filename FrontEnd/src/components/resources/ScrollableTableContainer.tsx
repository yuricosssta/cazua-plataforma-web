//src/components/resources/ScrollableTableContainer.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, ArrowLeftRight } from "lucide-react";

interface ScrollableTableContainerProps {
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}

export function ScrollableTableContainer({
  children,
  className = "",
  ariaLabel = "Tabela com rolagem horizontal",
}: ScrollableTableContainerProps) {
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const topScrollRef = useRef<HTMLDivElement>(null);
  const isSyncingRef = useRef(false);

  const [hasOverflow, setHasOverflow] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [scrollWidth, setScrollWidth] = useState(0);
  const [clientWidth, setClientWidth] = useState(0);

  const updateScrollMetrics = useCallback(() => {
    const el = tableContainerRef.current;
    if (!el) return;

    const currentScrollWidth = el.scrollWidth;
    const currentClientWidth = el.clientWidth;
    const currentScrollLeft = el.scrollLeft;

    const overflow = currentScrollWidth > currentClientWidth + 1;
    setHasOverflow(overflow);
    setScrollWidth(currentScrollWidth);
    setClientWidth(currentClientWidth);
    setCanScrollLeft(currentScrollLeft > 1);
    setCanScrollRight(
      overflow && currentScrollLeft + currentClientWidth < currentScrollWidth - 1
    );
  }, []);

  useEffect(() => {
    updateScrollMetrics();

    const tableEl = tableContainerRef.current;
    if (!tableEl) return;

    const resizeObserver = new ResizeObserver(() => {
      updateScrollMetrics();
    });
    resizeObserver.observe(tableEl);
    if (tableEl.firstElementChild) {
      resizeObserver.observe(tableEl.firstElementChild);
    }

    const mutationObserver = new MutationObserver(() => {
      if (tableEl.firstElementChild) {
        resizeObserver.observe(tableEl.firstElementChild);
      }
      updateScrollMetrics();
    });
    mutationObserver.observe(tableEl, {
      childList: true,
      subtree: true,
    });

    window.addEventListener("resize", updateScrollMetrics);
    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener("resize", updateScrollMetrics);
    };
  }, [updateScrollMetrics]);

  useEffect(() => {
    if (!hasOverflow || !topScrollRef.current || !tableContainerRef.current) {
      return;
    }
    const tableEl = tableContainerRef.current;
    const topEl = topScrollRef.current;
    const maxTable = tableEl.scrollWidth - tableEl.clientWidth;
    const maxTop = topEl.scrollWidth - topEl.clientWidth;
    const targetTopLeft =
      maxTable > 0 && maxTop > 0
        ? Math.round((tableEl.scrollLeft / maxTable) * maxTop)
        : 0;
    if (Math.abs(topEl.scrollLeft - targetTopLeft) >= 1) {
      isSyncingRef.current = true;
      topEl.scrollLeft = targetTopLeft;
      requestAnimationFrame(() => {
        isSyncingRef.current = false;
      });
    }
  }, [hasOverflow, scrollWidth, clientWidth]);

  const handleTopScroll = useCallback(() => {
    if (isSyncingRef.current) return;
    const topEl = topScrollRef.current;
    const tableEl = tableContainerRef.current;
    if (!topEl || !tableEl) return;

    const maxTop = topEl.scrollWidth - topEl.clientWidth;
    const maxTable = tableEl.scrollWidth - tableEl.clientWidth;
    const targetTableLeft =
      maxTop > 0 && maxTable > 0
        ? Math.round((topEl.scrollLeft / maxTop) * maxTable)
        : 0;

    if (Math.abs(tableEl.scrollLeft - targetTableLeft) < 1) {
      updateScrollMetrics();
      return;
    }

    isSyncingRef.current = true;
    tableEl.scrollLeft = targetTableLeft;
    updateScrollMetrics();
    requestAnimationFrame(() => {
      isSyncingRef.current = false;
    });
  }, [updateScrollMetrics]);

  const handleTableScroll = useCallback(() => {
    updateScrollMetrics();
    if (isSyncingRef.current) return;
    const topEl = topScrollRef.current;
    const tableEl = tableContainerRef.current;
    if (!topEl || !tableEl) return;

    const maxTable = tableEl.scrollWidth - tableEl.clientWidth;
    const maxTop = topEl.scrollWidth - topEl.clientWidth;
    const targetTopLeft =
      maxTable > 0 && maxTop > 0
        ? Math.round((tableEl.scrollLeft / maxTable) * maxTop)
        : 0;

    if (Math.abs(topEl.scrollLeft - targetTopLeft) < 1) return;

    isSyncingRef.current = true;
    topEl.scrollLeft = targetTopLeft;
    requestAnimationFrame(() => {
      isSyncingRef.current = false;
    });
  }, [updateScrollMetrics]);

  const handleScrollStep = (direction: "left" | "right") => {
    const tableEl = tableContainerRef.current;
    if (!tableEl) return;
    const step = Math.max(200, Math.round(tableEl.clientWidth * 0.65));
    tableEl.scrollBy({
      left: direction === "left" ? -step : step,
      behavior: "smooth",
    });
  };

  return (
    <div className={`w-full min-w-0 overflow-hidden ${className}`.trim()}>
      {hasOverflow && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/20">
          <button
            type="button"
            onClick={() => handleScrollStep("left")}
            disabled={!canScrollLeft}
            aria-label="Rolar tabela para a esquerda"
            className="min-w-11 min-h-11 shrink-0 inline-flex items-center justify-center rounded-md border border-border bg-background text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex-1 min-w-0 flex flex-col gap-1">
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1.5 text-center">
              <ArrowLeftRight className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="sm:hidden">Deslize ou use as setas</span>
              <span className="hidden sm:inline truncate">
                Role para o lado ou use as setas para ver todas as colunas
              </span>
            </div>
            <div
              ref={topScrollRef}
              onScroll={handleTopScroll}
              aria-hidden="true"
              tabIndex={-1}
              className="w-full overflow-x-auto py-1"
            >
              <div
                style={{ width: `${scrollWidth}px` }}
                className="h-1.5 bg-muted/60 rounded-md"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleScrollStep("right")}
            disabled={!canScrollRight}
            aria-label="Rolar tabela para a direita"
            className="min-w-11 min-h-11 shrink-0 inline-flex items-center justify-center rounded-md border border-border bg-background text-foreground hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      <div
        ref={tableContainerRef}
        role="region"
        aria-label={ariaLabel}
        tabIndex={hasOverflow ? 0 : undefined}
        onScroll={handleTableScroll}
        className="w-full overflow-x-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {children}
      </div>
    </div>
  );
}
