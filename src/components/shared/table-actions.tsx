import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TableActionsProps {
  onEdit?: () => void;
  onDelete?: () => void;
  canManage?: boolean;
}

export function TableActions({
  onEdit,
  onDelete,
  canManage = true,
}: TableActionsProps) {
  return (
    <div className="flex items-center justify-end gap-2">
      <Button
        disabled={!canManage || !onEdit}
        onClick={onEdit}
        size="sm"
        type="button"
        variant="outline"
      >
        <Pencil className="mr-1 h-3.5 w-3.5" />
        Edit
      </Button>
      <Button
        className="border-destructive/30 text-destructive hover:bg-destructive/10"
        disabled={!canManage || !onDelete}
        onClick={onDelete}
        size="sm"
        type="button"
        variant="outline"
      >
        <Trash2 className="mr-1 h-3.5 w-3.5" />
        Delete
      </Button>
    </div>
  );
}
