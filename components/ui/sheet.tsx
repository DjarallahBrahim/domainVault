import * as React from "react";
import { cn } from "@/lib/utils";

type SheetProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
};

const SheetContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
} | null>(null);

function Sheet({ open: controlledOpen, onOpenChange, children }: SheetProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;
  const setOpen = onOpenChange || setUncontrolledOpen;

  return (
    <SheetContext.Provider value={{ open, setOpen }}>
      {children}
    </SheetContext.Provider>
  );
}

function SheetTrigger({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) {
  const ctx = React.useContext(SheetContext);
  if (!ctx) throw new Error("SheetTrigger must be used within Sheet");

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onClick?: React.MouseEventHandler }>, {
      onClick: () => ctx.setOpen(!ctx.open),
    });
  }

  return (
    <button type="button" onClick={() => ctx.setOpen(!ctx.open)}>
      {children}
    </button>
  );
}

function SheetContent({
  className,
  side = "left",
  children,
}: {
  className?: string;
  side?: "left" | "right";
  children: React.ReactNode;
}) {
  const ctx = React.useContext(SheetContext);
  if (!ctx) throw new Error("SheetContent must be used within Sheet");

  if (!ctx.open) return null;

  const sideClasses = side === "left" ? "left-0" : "right-0";

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={() => ctx.setOpen(false)}
      />
      <div
        className={cn(
          "fixed top-0 z-50 h-full w-64 bg-bg-surface border-border p-4 shadow-lg",
          sideClasses,
          side === "right" ? "border-l" : "border-r",
          className
        )}
      >
        {children}
      </div>
    </>
  );
}

export { Sheet, SheetTrigger, SheetContent };
