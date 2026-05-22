"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";

interface DomainDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  count: number;
  onConfirm: () => void;
}

export function DomainDeleteDialog({
  open,
  onOpenChange,
  count,
  onConfirm,
}: DomainDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-accent-danger" />
            Delete {count} domain{count !== 1 ? "s" : ""}?
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone.{" "}
            {count > 1
              ? `All ${count} domains will be permanently removed from your portfolio.`
              : "This domain will be permanently removed from your portfolio."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded-md bg-bg-elevated text-text-primary text-sm font-medium hover:bg-bg-elevated/80"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-md bg-accent-danger text-white text-sm font-medium hover:bg-accent-danger/90"
          >
            Delete
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
