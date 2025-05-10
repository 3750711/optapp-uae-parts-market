import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp, Search } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"

import { cn } from "@/lib/utils"

const Select = SelectPrimitive.Root

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content> & {
    searchPlaceholder?: string;
    onSearchChange?: (value: string) => void;
    searchValue?: string;
    showSearch?: boolean;
  }
>(({ className, children, position = "popper", searchPlaceholder, onSearchChange, searchValue, showSearch = false, ...props }, ref) => {
  const isMobile = useIsMobile();
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  
  // Focus the search input when content opens
  React.useEffect(() => {
    if (showSearch && searchInputRef.current) {
      // Use a small timeout to ensure the dropdown is fully open
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [showSearch]);
  
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        className={cn(
          "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-white text-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className
        )}
        position={position}
        // Prevent dropdown from closing when clicking or interacting with search input
        onPointerDownOutside={(e) => {
          if (showSearch && searchInputRef.current?.contains(e.target as Node)) {
            e.preventDefault();
          }
        }}
        {...props}
      >
        <SelectScrollUpButton />
        {showSearch && (
          <div className="sticky top-0 px-1 pt-1 pb-0 z-10 bg-white">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                placeholder={searchPlaceholder || "Поиск..."}
                className={cn(
                  "w-full px-8 py-2 border rounded-md border-input text-sm focus:outline-none focus:ring-1 focus:ring-ring",
                  isMobile && "text-base py-2.5" // Larger text and padding for mobile
                )}
                value={searchValue || ""}
                onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                // Comprehensive event handling to prevent dropdown closing
                onClick={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()} 
                onTouchEnd={(e) => e.stopPropagation()} 
                onTouchMove={(e) => e.stopPropagation()} 
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  // Only stop propagation for keys that might close or interact with dropdown
                  if (e.key === 'Escape') {
                    // Let Escape close the dropdown but not clear the search
                    e.stopPropagation();
                    document.activeElement instanceof HTMLElement && document.activeElement.blur();
                  } else if (['ArrowUp', 'ArrowDown', 'Enter', 'Tab', 'Home', 'End', 'PageUp', 'PageDown'].includes(e.key)) {
                    // Let these keys work for navigation but don't interrupt typing
                    e.stopPropagation();
                  }
                }}
                // Prevent input from losing focus
                onBlur={(e) => {
                  // Prevent blur if it's related to dropdown interaction
                  if (e.relatedTarget && (e.relatedTarget as HTMLElement).closest('[data-radix-select-content]')) {
                    e.preventDefault();
                    searchInputRef.current?.focus();
                  }
                }}
                autoCapitalize="none"
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
              />
              {searchValue && (
                <button
                  className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600 h-5 w-5 flex items-center justify-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onSearchChange && onSearchChange("");
                    searchInputRef.current?.focus();
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                  }}
                  type="button"
                >
                  <span className="sr-only">Очистить</span>
                  <span aria-hidden="true" className="text-lg">×</span>
                </button>
              )}
            </div>
          </div>
        )}
        <SelectPrimitive.Viewport
          className={cn(
            "p-1 bg-white",
            position === "popper" &&
              "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]",
            showSearch && "pt-0"
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
})
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => {
  const isMobile = useIsMobile();
  
  return (
    <SelectPrimitive.Item
      ref={ref}
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        isMobile && "py-2.5 text-base", // Larger size for mobile
        className
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="h-4 w-4" />
        </SelectPrimitive.ItemIndicator>
      </span>

      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
})
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}
