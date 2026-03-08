import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionPath?: string;
  onAction?: () => void;
  emoji?: string;
}

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionPath,
  onAction,
  emoji,
}: EmptyStateProps) => (
  <div className="py-10 px-6 text-center flex flex-col items-center gap-3">
    <div className="w-16 h-16 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-center mx-auto">
      {emoji ? (
        <span className="text-2xl">{emoji}</span>
      ) : (
        <Icon className="w-7 h-7 text-primary/40" />
      )}
    </div>
    <div>
      <h3 className="text-sm font-bold text-foreground">{title}</h3>
      <p className="text-xs text-muted-foreground max-w-[240px] mx-auto mt-1 leading-relaxed">
        {description}
      </p>
    </div>
    {actionLabel && actionPath && (
      <Link to={actionPath}>
        <Button size="sm" className="rounded-xl font-bold text-xs mt-1">
          {actionLabel}
        </Button>
      </Link>
    )}
    {actionLabel && onAction && !actionPath && (
      <Button size="sm" onClick={onAction} className="rounded-xl font-bold text-xs mt-1">
        {actionLabel}
      </Button>
    )}
  </div>
);
