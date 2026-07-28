import { Inbox } from "lucide-react";
import { Button } from "./Button";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
  icon?: React.ReactNode;
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
        {icon || <Inbox className="w-6 h-6 text-slate-400" />}
      </div>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">{description}</p>
      {action && (
        <div className="mt-4">
          <Button onClick={action.onClick} size="sm">{action.label}</Button>
        </div>
      )}
    </div>
  );
}
