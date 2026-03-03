import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PageHeaderProps {
    title: string;
    description?: string;
    icon?: LucideIcon;
    badge?: string;
    badgeVariant?: "default" | "destructive" | "outline" | "secondary";
    actions?: ReactNode;
}

export const PageHeader = ({
    title,
    description,
    icon: Icon,
    badge,
    badgeVariant = "secondary",
    actions,
}: PageHeaderProps) => {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
                {Icon && (
                    <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                        <Icon className="w-5 h-5 text-primary" />
                    </div>
                )}
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                        {badge && <Badge variant={badgeVariant} className="text-xs">{badge}</Badge>}
                    </div>
                    {description && (
                        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
                    )}
                </div>
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
    );
};
