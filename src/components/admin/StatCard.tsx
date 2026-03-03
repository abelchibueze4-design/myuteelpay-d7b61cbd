import { ReactNode } from "react";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
    label: string;
    value: string;
    sub?: string;
    icon: LucideIcon;
    iconColor?: string;
    iconBg?: string;
    trend?: number;
    trendLabel?: string;
    highlight?: boolean;
}

export const StatCard = ({
    label,
    value,
    sub,
    icon: Icon,
    iconColor = "text-primary",
    iconBg = "bg-primary/10",
    trend,
    trendLabel,
    highlight = false,
}: StatCardProps) => {
    const TrendIcon = trend === undefined ? Minus : trend > 0 ? TrendingUp : TrendingDown;
    const trendColor =
        trend === undefined ? "text-muted-foreground" : trend > 0 ? "text-emerald-500" : "text-destructive";

    return (
        <div
            className={`relative overflow-hidden rounded-2xl p-6 border transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 group ${highlight
                    ? "bg-gradient-to-br from-primary to-purple-700 border-primary/50 text-white shadow-primary/20 shadow-lg"
                    : "bg-card border-border hover:border-primary/30"
                }`}
        >
            {/* Subtle glow decoration */}
            {highlight && (
                <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10 blur-2xl pointer-events-none" />
            )}

            <div className="flex items-start justify-between mb-4">
                <div
                    className={`p-2.5 rounded-xl ${highlight ? "bg-white/20" : iconBg} transition-transform group-hover:scale-110`}
                >
                    <Icon className={`w-5 h-5 ${highlight ? "text-white" : iconColor}`} />
                </div>
                {trend !== undefined && (
                    <div className={`flex items-center gap-1 text-xs font-semibold ${highlight ? "text-white/80" : trendColor}`}>
                        <TrendIcon className="w-3.5 h-3.5" />
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>

            <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${highlight ? "text-white/70" : "text-muted-foreground"}`}>
                {label}
            </p>
            <p className={`text-2xl font-extrabold leading-none ${highlight ? "text-white" : ""}`}>{value}</p>
            {sub && (
                <p className={`text-xs mt-1.5 ${highlight ? "text-white/60" : "text-muted-foreground"}`}>{sub}</p>
            )}
            {trendLabel && (
                <p className={`text-xs mt-2 font-medium ${highlight ? "text-white/70" : "text-muted-foreground"}`}>
                    {trendLabel}
                </p>
            )}
        </div>
    );
};
