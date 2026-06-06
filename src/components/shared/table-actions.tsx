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
        variant="ghost"
      >
        <Pencil className="mr-1 h-3.5 w-3.5" />
        Edit
      </Button>
      <Button
        disabled={!canManage || !onDelete}
        onClick={onDelete}
        size="sm"
        type="button"
        variant="ghost"
      >
        <Trash2 className="mr-1 h-3.5 w-3.5" />
        Delete
      </Button>
    </div>
  );
}
