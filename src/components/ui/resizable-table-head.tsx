import * as React from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResizableTableHeadProps {
  columnId: string;
  width: number;
  minWidth?: number;
  maxWidth?: number;
  onResize: (columnId: string, width: number) => void;
  sortable?: boolean;
  sorted?: 'asc' | 'desc' | null;
  onSort?: () => void;
  children: React.ReactNode;
  className?: string;
}

export const ResizableTableHead = React.forwardRef<
  HTMLTableHeaderCellElement,
  ResizableTableHeadProps
>(
  (
    {
      columnId,
      width,
      minWidth = 60,
      maxWidth = 800,
      onResize,
      sortable = false,
      sorted = null,
      onSort,
      children,
      className,
    },
    ref
  ) => {
    const [isResizing, setIsResizing] = React.useState(false);
    const [showTooltip, setShowTooltip] = React.useState(false);
    const [currentWidth, setCurrentWidth] = React.useState(width);

    React.useEffect(() => {
      setCurrentWidth(width);
    }, [width]);

    const handleMouseDown = React.useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        setIsResizing(true);
        setShowTooltip(true);
        const startX = e.clientX;
        const startWidth = currentWidth;

        const handleMouseMove = (moveEvent: MouseEvent) => {
          const diff = moveEvent.clientX - startX;
          const newWidth = Math.max(
            minWidth,
            Math.min(maxWidth, startWidth + diff)
          );
          setCurrentWidth(newWidth);
        };

        const handleMouseUp = () => {
          setIsResizing(false);
          setShowTooltip(false);
          onResize(columnId, currentWidth);
          document.removeEventListener("mousemove", handleMouseMove);
          document.removeEventListener("mouseup", handleMouseUp);
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
      },
      [columnId, currentWidth, minWidth, maxWidth, onResize]
    );

    const handleHeaderClick = React.useCallback(
      (e: React.MouseEvent) => {
        // Prevent sort when clicking on resize handle
        if ((e.target as HTMLElement).classList.contains('resize-handle')) {
          return;
        }
        if (sortable && onSort) {
          onSort();
        }
      },
      [sortable, onSort]
    );

    return (
      <th
        ref={ref}
        className={cn(
          "h-10 px-2 text-left align-middle font-medium text-muted-foreground relative",
          sortable && "cursor-pointer select-none",
          className
        )}
        style={{ width: currentWidth, minWidth: currentWidth, maxWidth: currentWidth }}
      >
        <div
          className="flex items-center gap-2 h-full"
          onClick={handleHeaderClick}
        >
          <span className="flex-1 truncate">{children}</span>
          {sortable && (
            <span className="flex-shrink-0">
              {sorted === 'asc' ? (
                <ArrowUp className="h-4 w-4" />
              ) : sorted === 'desc' ? (
                <ArrowDown className="h-4 w-4" />
              ) : (
                <ArrowUpDown className="h-4 w-4 opacity-50" />
              )}
            </span>
          )}
        </div>

        {/* Resize handle */}
        <div
          className={cn(
            "resize-handle absolute right-0 top-0 bottom-0 w-1 cursor-col-resize select-none transition-colors",
            "hover:bg-primary/50",
            isResizing && "bg-primary"
          )}
          onMouseDown={handleMouseDown}
        />

        {/* Tooltip with current width */}
        {showTooltip && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-md border z-50 whitespace-nowrap">
            {Math.round(currentWidth)}px
          </div>
        )}

        {/* Resize overlay */}
        {isResizing && (
          <div className="fixed inset-0 z-40 cursor-col-resize" />
        )}
      </th>
    );
  }
);

ResizableTableHead.displayName = "ResizableTableHead";
