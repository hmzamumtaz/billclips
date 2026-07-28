import { Inbox } from "lucide-react";
import { Button } from "./Button";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export function EmptyState({ title, description, action, icon, children }: EmptyStateProps) {
  return (
    <div className="text-center py-16 animate-fade-in">
      <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
        {icon || <Inbox className="w-7 h-7 text-slate-300" />}
      </div>
      <h3 className="text-base font-semibold text-[var(--fg)]">{title}</h3>
      <p className="mt-1.5 text-sm text-[var(--fg-muted)] max-w-xs mx-auto leading-relaxed">{description}</p>
      {action && (
        <div className="mt-5">
          <Button onClick={action.onClick} size="sm">{action.label}</Button>
        </div>
      )}
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}
