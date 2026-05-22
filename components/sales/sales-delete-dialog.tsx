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

interface SalesDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function SalesDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
}: SalesDeleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-accent-danger" />
            Delete this sale?
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. The sale record will be permanently
            removed and the associated domain may revert to "active" if this
            was the last sale for that domain.
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
