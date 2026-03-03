import { useState } from "react";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    Bell, Send, Clock, Zap, RefreshCw, CheckCircle2, XCircle,
    Mail, MessageSquare, Smartphone, Radio, Users, TrendingUp,
    Activity, Eye, MousePointer, AlertTriangle, Calendar,
    Plus, Trash2, Play, PauseCircle, Settings, ToggleLeft,
    ToggleRight, Download,
} from "lucide-react";
import {
    useNotificationLogs,
    useScheduledNotifications,
    useNotificationTemplates,
    useNotificationStats,
    useBroadcast,
    useScheduleNotification,
    useCancelScheduled,
    useRetryFailed,
    useToggleTemplate,
    ScheduledNotification,
    NotificationTemplate,
} from "@/hooks/useNotifications";
import { format, parseISO, isPast } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────
const AUDIENCES = [
    { value: "all", label: "All Users", icon: Users, desc: "Every registered user" },
    { value: "verified", label: "Verified Users", icon: CheckCircle2, desc: "Users with at least one transaction" },
    { value: "high_spenders", label: "High Spenders", icon: TrendingUp, desc: "Users who spent > ₦10,000 total" },
    { value: "inactive", label: "Inactive Users", icon: PauseCircle, desc: "No activity in last 30 days" },
    { value: "kyc_level_1", label: "KYC Level 1", icon: CheckCircle2, desc: "Basic KYC verified" },
];

const CHANNELS = [
    { key: "in_app", label: "In-App", icon: Bell, color: "bg-primary/15 text-primary border-primary/30" },
    { key: "email", label: "Email", icon: Mail, color: "bg-blue-50 text-blue-700 border-blue-200" },
    { key: "sms", label: "SMS", icon: MessageSquare, color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    { key: "push", label: "Push", icon: Smartphone, color: "bg-amber-50 text-amber-700 border-amber-200" },
];

const NOTIF_TYPES = [
    "general", "transaction", "wallet", "kyc", "security",
    "referral", "promo", "system", "reconciliation",
];

const LOG_STATUS_COLOR: Record<string, string> = {
    delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
    sent: "bg-blue-50 text-blue-700 border-blue-200",
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    failed: "bg-red-50 text-red-700 border-red-200",
    bounced: "bg-orange-50 text-orange-700 border-orange-200",
};

const SCHED_STATUS_COLOR: Record<string, string> = {
    scheduled: "bg-blue-50 text-blue-700 border-blue-200",
    processing: "bg-amber-50 text-amber-700 border-amber-200",
    sent: "bg-emerald-50 text-emerald-700 border-emerald-200",
    cancelled: "bg-slate-100 text-slate-600 border-slate-200",
    failed: "bg-red-50 text-red-700 border-red-200",
};

// ─── Broadcast Compose Form ─────────────────────────────────────────────────
const BroadcastForm = () => {
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [type, setType] = useState("general");
    const [audience, setAudience] = useState("all");
    const [selectedChannels, setSelectedChannels] = useState<string[]>(["in_app"]);
    const [actionUrl, setActionUrl] = useState("");
    const [preview, setPreview] = useState(false);

    const broadcast = useBroadcast();

    const toggleChannel = (key: string) => {
        setSelectedChannels((prev) =>
            prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]
        );
    };

    const handleSend = async () => {
        if (!title.trim() || !body.trim()) return toast.error("Title and message are required");
        if (!selectedChannels.length) return toast.error("Select at least one channel");
        await broadcast.mutateAsync({
            title: title.trim(),
            body: body.trim(),
            type,
            audience,
            channels: selectedChannels,
            action_url: actionUrl || undefined,
        });
        setTitle(""); setBody(""); setActionUrl("");
    };

    const selectedAudience = AUDIENCES.find((a) => a.value === audience);

    return (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Compose */}
            <div className="xl:col-span-2 bg-card border border-border rounded-2xl p-6 space-y-5">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Radio className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-bold text-base">Compose Broadcast</h3>
                        <p className="text-xs text-muted-foreground">Send to a segment across multiple channels</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Notification Title</label>
                        <Input
                            placeholder="e.g. 🎁 Exclusive Offer Unlocked"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            maxLength={80}
                        />
                        <p className="text-[10px] text-muted-foreground mt-1 text-right">{title.length}/80</p>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Type</label>
                        <Select value={type} onValueChange={setType}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {NOTIF_TYPES.map((t) => (
                                    <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Message Body</label>
                    <Textarea
                        placeholder="Write your notification message here... Use {{variable}} for dynamic content."
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        rows={4}
                        maxLength={500}
                        className="resize-none"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1 text-right">{body.length}/500</p>
                </div>

                <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Action URL (optional)</label>
                    <Input
                        placeholder="https://app.uteelpay.com/wallet"
                        value={actionUrl}
                        onChange={(e) => setActionUrl(e.target.value)}
                    />
                </div>

                {/* Channels */}
                <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-2 block">Delivery Channels</label>
                    <div className="flex flex-wrap gap-2">
                        {CHANNELS.map((ch) => {
                            const active = selectedChannels.includes(ch.key);
                            return (
                                <button
                                    key={ch.key}
                                    onClick={() => toggleChannel(ch.key)}
                                    className={cn(
                                        "flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all",
                                        active ? ch.color + " shadow-sm" : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                                    )}
                                >
                                    <ch.icon className="w-3.5 h-3.5" />
                                    {ch.label}
                                    {active && <CheckCircle2 className="w-3 h-3 ml-0.5" />}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreview(!preview)}
                    >
                        <Eye className="w-3.5 h-3.5 mr-1.5" />
                        {preview ? "Hide" : "Preview"}
                    </Button>
                    <Button
                        onClick={handleSend}
                        disabled={broadcast.isPending || !title || !body}
                        className="gap-2"
                    >
                        {broadcast.isPending ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <Send className="w-3.5 h-3.5" />
                        )}
                        {broadcast.isPending ? "Sending..." : "Send Broadcast"}
                    </Button>
                </div>

                {/* Preview */}
                {preview && title && (
                    <div className="border border-border rounded-xl overflow-hidden">
                        <div className="bg-accent/50 px-4 py-2 border-b border-border">
                            <p className="text-xs font-semibold text-muted-foreground">IN-APP PREVIEW</p>
                        </div>
                        <div className="p-4 flex items-start gap-3">
                            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                <Bell className="w-4 h-4 text-primary" />
                            </div>
                            <div className="min-w-0">
                                <p className="font-semibold text-sm">{title || "Your notification title"}</p>
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-3">{body || "Your notification body text appears here..."}</p>
                                <p className="text-[10px] text-muted-foreground mt-1.5">Just now</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Audience Picker */}
            <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                <div>
                    <h3 className="font-bold text-base mb-0.5">Target Audience</h3>
                    <p className="text-xs text-muted-foreground">Choose who receives this notification</p>
                </div>
                <div className="space-y-2">
                    {AUDIENCES.map((a) => (
                        <button
                            key={a.value}
                            onClick={() => setAudience(a.value)}
                            className={cn(
                                "w-full text-left p-3 rounded-xl border transition-all",
                                audience === a.value
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:border-primary/30 hover:bg-accent/20"
                            )}
                        >
                            <div className="flex items-center gap-2.5">
                                <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", audience === a.value ? "bg-primary/15" : "bg-accent")}>
                                    <a.icon className={cn("w-3.5 h-3.5", audience === a.value ? "text-primary" : "text-muted-foreground")} />
                                </div>
                                <div className="min-w-0">
                                    <p className={cn("text-sm font-semibold", audience === a.value ? "text-primary" : "")}>{a.label}</p>
                                    <p className="text-[10px] text-muted-foreground">{a.desc}</p>
                                </div>
                                {audience === a.value && (
                                    <CheckCircle2 className="w-4 h-4 text-primary ml-auto shrink-0" />
                                )}
                            </div>
                        </button>
                    ))}
                </div>

                {selectedAudience && (
                    <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl">
                        <p className="text-xs font-semibold text-primary">Ready to send to:</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{selectedAudience.label} · via {selectedChannels.join(", ") || "no channels"}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Schedule Form ──────────────────────────────────────────────────────────
const ScheduleForm = ({ onSuccess }: { onSuccess: () => void }) => {
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");
    const [type, setType] = useState("general");
    const [audience, setAudience] = useState("all");
    const [channels, setChannels] = useState<string[]>(["in_app"]);
    const [schedDate, setSchedDate] = useState("");
    const [schedTime, setSchedTime] = useState("09:00");
    const [actionUrl, setActionUrl] = useState("");

    const schedule = useScheduleNotification();

    const toggleChannel = (key: string) => {
        setChannels((prev) =>
            prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]
        );
    };

    const handleSchedule = async () => {
        if (!title || !body || !schedDate) return toast.error("Fill in all required fields");
        const scheduledAt = new Date(`${schedDate}T${schedTime}:00`).toISOString();
        await schedule.mutateAsync({
            title, body, type, audience, channels, scheduled_at: scheduledAt,
            action_url: actionUrl || undefined,
        });
        setTitle(""); setBody(""); setSchedDate(""); setActionUrl("");
        onSuccess();
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Title *</label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Maintenance Alert" />
                </div>
                <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Type</label>
                    <Select value={type} onValueChange={setType}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {NOTIF_TYPES.map((t) => (
                                <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Message *</label>
                <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} className="resize-none" placeholder="Your notification body..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Date *</label>
                    <Input type="date" value={schedDate} onChange={(e) => setSchedDate(e.target.value)} min={new Date().toISOString().slice(0, 10)} />
                </div>
                <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Time (WAT)</label>
                    <Input type="time" value={schedTime} onChange={(e) => setSchedTime(e.target.value)} />
                </div>
            </div>
            <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Audience</label>
                <Select value={audience} onValueChange={setAudience}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {AUDIENCES.map((a) => (
                            <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div>
                <label className="text-xs font-semibold text-muted-foreground mb-2 block">Channels</label>
                <div className="flex gap-2 flex-wrap">
                    {CHANNELS.map((ch) => (
                        <button
                            key={ch.key}
                            onClick={() => toggleChannel(ch.key)}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all",
                                channels.includes(ch.key)
                                    ? ch.color + " shadow-sm"
                                    : "border-border text-muted-foreground hover:border-primary/40"
                            )}
                        >
                            <ch.icon className="w-3 h-3" />
                            {ch.label}
                        </button>
                    ))}
                </div>
            </div>
            <Button onClick={handleSchedule} disabled={schedule.isPending} className="w-full gap-2">
                {schedule.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Calendar className="w-3.5 h-3.5" />}
                {schedule.isPending ? "Scheduling..." : "Schedule Notification"}
            </Button>
        </div>
    );
};

// ─── Main Page ──────────────────────────────────────────────────────────────
const NotificationCenter = () => {
    const [logStatus, setLogStatus] = useState("all");
    const [schedDialog, setSchedDialog] = useState(false);
    const [tab, setTab] = useState("broadcast");

    const { data: logs, isLoading: logsLoading, refetch: refetchLogs } = useNotificationLogs(logStatus);
    const { data: scheduled, isLoading: schedLoading } = useScheduledNotifications();
    const { data: templates } = useNotificationTemplates();
    const { data: stats } = useNotificationStats();

    const cancelScheduled = useCancelScheduled();
    const retryFailed = useRetryFailed();
    const toggleTemplate = useToggleTemplate();

    const pendingCount = (scheduled ?? []).filter((s) => s.status === "scheduled").length;

    // Export logs CSV
    const exportLogs = () => {
        const rows = [
            ["ID", "Channel", "Status", "Provider", "Opened", "Clicked", "Retries", "Date"],
            ...(logs ?? []).map((l) => [
                l.id.slice(0, 8),
                l.channel,
                l.status,
                l.provider ?? "—",
                l.opened_at ? "Yes" : "No",
                l.clicked_at ? "Yes" : "No",
                l.retry_count,
                format(new Date(l.created_at), "yyyy-MM-dd HH:mm"),
            ]),
        ];
        const csv = rows.map((r) => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "notification_logs.csv"; a.click();
    };

    return (
        <div className="max-w-screen-2xl space-y-8">
            <PageHeader
                title="Notification Center"
                description="Broadcast, schedule, and track notifications across all channels"
                icon={Bell}
                badge={pendingCount > 0 ? `${pendingCount} scheduled` : undefined}
                actions={
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setSchedDialog(true)}>
                            <Calendar className="w-3.5 h-3.5 mr-1.5" /> Schedule
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => retryFailed.mutateAsync()}
                            disabled={retryFailed.isPending}
                        >
                            <RefreshCw className={cn("w-3.5 h-3.5 mr-1.5", retryFailed.isPending && "animate-spin")} />
                            Retry Failed
                        </Button>
                    </div>
                }
            />

            {/* KPI Cards */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard
                    label="Total Sent"
                    value={(stats?.total_sent ?? 0).toLocaleString()}
                    icon={Send}
                    highlight
                />
                <StatCard
                    label="Delivered"
                    value={(stats?.delivered ?? 0).toLocaleString()}
                    icon={CheckCircle2}
                    iconColor="text-emerald-500"
                    iconBg="bg-emerald-500/10"
                    sub={`${stats?.open_rate_pct ?? 0}% open rate`}
                />
                <StatCard
                    label="Failed"
                    value={(stats?.failed ?? 0).toLocaleString()}
                    icon={XCircle}
                    iconColor={stats?.failed ? "text-red-500" : "text-muted-foreground"}
                    iconBg={stats?.failed ? "bg-red-500/10" : "bg-accent"}
                />
                <StatCard
                    label="Click Rate"
                    value={`${stats?.click_rate_pct ?? 0}%`}
                    icon={MousePointer}
                    iconColor="text-blue-500"
                    iconBg="bg-blue-500/10"
                    sub={`${stats?.opened ?? 0} opened · ${stats?.clicked ?? 0} clicked`}
                />
            </div>

            {/* Tabs */}
            <Tabs value={tab} onValueChange={setTab}>
                <TabsList className="border border-border bg-card rounded-xl p-1 h-auto gap-1">
                    {[
                        { value: "broadcast", label: "Broadcast", icon: Radio },
                        { value: "scheduled", label: "Scheduled", icon: Clock },
                        { value: "triggers", label: "Smart Triggers", icon: Zap },
                        { value: "logs", label: "Delivery Logs", icon: Activity },
                    ].map((t) => (
                        <TabsTrigger
                            key={t.value}
                            value={t.value}
                            className="rounded-lg px-4 py-2 text-xs font-semibold data-[state=active]:bg-primary data-[state=active]:text-white transition-all flex items-center gap-1.5"
                        >
                            <t.icon className="w-3.5 h-3.5" />
                            {t.label}
                            {t.value === "scheduled" && pendingCount > 0 && (
                                <Badge variant="destructive" className="text-[9px] h-4 px-1 ml-0.5">{pendingCount}</Badge>
                            )}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {/* ── Broadcast Tab ── */}
                <TabsContent value="broadcast" className="mt-6">
                    <BroadcastForm />
                </TabsContent>

                {/* ── Scheduled Tab ── */}
                <TabsContent value="scheduled" className="mt-6">
                    <div className="bg-card border border-border rounded-2xl overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-border">
                            <div>
                                <h3 className="font-bold text-base">Scheduled Notifications</h3>
                                <p className="text-xs text-muted-foreground mt-0.5">Maintenance alerts, promos, and reminders</p>
                            </div>
                            <Button size="sm" onClick={() => setSchedDialog(true)}>
                                <Plus className="w-3.5 h-3.5 mr-1.5" /> New Schedule
                            </Button>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow className="border-border hover:bg-transparent">
                                    <TableHead className="text-xs uppercase font-semibold">Notification</TableHead>
                                    <TableHead className="text-xs uppercase font-semibold">Audience</TableHead>
                                    <TableHead className="text-xs uppercase font-semibold">Channels</TableHead>
                                    <TableHead className="text-xs uppercase font-semibold">Scheduled</TableHead>
                                    <TableHead className="text-xs uppercase font-semibold">Status</TableHead>
                                    <TableHead className="text-xs uppercase font-semibold text-right">Recipients</TableHead>
                                    <TableHead className="text-xs uppercase font-semibold text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {schedLoading ? (
                                    Array.from({ length: 3 }).map((_, i) => (
                                        <TableRow key={i} className="animate-pulse border-border">
                                            {Array.from({ length: 7 }).map((_, j) => (
                                                <TableCell key={j}><div className="h-6 bg-accent rounded" /></TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : (scheduled ?? []).length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center text-muted-foreground py-12 italic">
                                            No scheduled notifications. Create one to get started.
                                        </TableCell>
                                    </TableRow>
                                ) : (scheduled ?? []).map((s) => (
                                    <TableRow key={s.id} className="border-border hover:bg-accent/20 transition-colors">
                                        <TableCell>
                                            <p className="text-sm font-semibold line-clamp-1">{s.title}</p>
                                            <p className="text-[10px] text-muted-foreground line-clamp-1">{s.body}</p>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-[10px] capitalize">{s.audience.replace(/_/g, " ")}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                {s.channel?.map((ch) => {
                                                    const cfg = CHANNELS.find((c) => c.key === ch);
                                                    if (!cfg) return null;
                                                    return <cfg.icon key={ch} className="w-3.5 h-3.5 text-muted-foreground" />;
                                                })}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-[10px] text-muted-foreground">
                                                <p className={cn(isPast(parseISO(s.scheduled_at)) && s.status === "scheduled" ? "text-amber-600 font-semibold" : "")}>
                                                    {format(parseISO(s.scheduled_at), "MMM d, h:mm a")}
                                                </p>
                                                <p>{isPast(parseISO(s.scheduled_at)) && s.status === "scheduled" ? "⚠ Overdue" : ""}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={cn("text-[10px] capitalize", SCHED_STATUS_COLOR[s.status])}>
                                                {s.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right text-sm font-medium">
                                            {s.recipient_count != null ? s.recipient_count.toLocaleString() : "—"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {s.status === "scheduled" && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => cancelScheduled.mutateAsync(s.id)}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                {/* ── Smart Triggers Tab ── */}
                <TabsContent value="triggers" className="mt-6">
                    <div className="bg-card border border-border rounded-2xl overflow-hidden">
                        <div className="p-6 border-b border-border">
                            <h3 className="font-bold text-base flex items-center gap-2">
                                <Zap className="w-4 h-4 text-amber-500" /> Smart Trigger Templates
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Auto-fire when events occur. Toggle active/inactive. These fire via the notification-engine Edge Function.
                            </p>
                        </div>
                        <div className="divide-y divide-border">
                            {(templates ?? []).map((tmpl) => (
                                <div
                                    key={tmpl.id}
                                    className={cn(
                                        "flex items-start gap-4 p-5 hover:bg-accent/10 transition-colors",
                                        !tmpl.is_active && "opacity-60"
                                    )}
                                >
                                    <div className={cn(
                                        "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                                        tmpl.is_active ? "bg-amber-50" : "bg-accent"
                                    )}>
                                        <Zap className={cn("w-4 h-4", tmpl.is_active ? "text-amber-500" : "text-muted-foreground")} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-semibold text-sm">{tmpl.title}</p>
                                            <code className="text-[9px] bg-accent text-muted-foreground px-1.5 py-0.5 rounded font-mono">{tmpl.slug}</code>
                                            <Badge variant="outline" className="text-[10px] capitalize">{tmpl.type}</Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{tmpl.body}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            {tmpl.channels.map((ch) => {
                                                const cfg = CHANNELS.find((c) => c.key === ch);
                                                return cfg ? (
                                                    <Badge key={ch} variant="outline" className={cn("text-[9px] gap-1", cfg.color)}>
                                                        <cfg.icon className="w-2.5 h-2.5" /> {cfg.label}
                                                    </Badge>
                                                ) : null;
                                            })}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <span className={cn("text-xs font-medium", tmpl.is_active ? "text-emerald-600" : "text-muted-foreground")}>
                                            {tmpl.is_active ? "Active" : "Inactive"}
                                        </span>
                                        <Switch
                                            checked={tmpl.is_active}
                                            onCheckedChange={(v) => toggleTemplate.mutateAsync({ id: tmpl.id, is_active: v })}
                                        />
                                    </div>
                                </div>
                            ))}
                            {(templates ?? []).length === 0 && (
                                <div className="py-12 text-center text-muted-foreground italic text-sm">
                                    No templates found. Run the migration to seed default templates.
                                </div>
                            )}
                        </div>
                    </div>
                </TabsContent>

                {/* ── Delivery Logs Tab ── */}
                <TabsContent value="logs" className="mt-6">
                    <div className="bg-card border border-border rounded-2xl overflow-hidden">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-6 border-b border-border">
                            <div>
                                <h3 className="font-bold text-base">Delivery Logs</h3>
                                <p className="text-xs text-muted-foreground mt-0.5">Delivery status, open/click tracking, and retry history</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex gap-1">
                                    {["all", "delivered", "failed", "pending"].map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => setLogStatus(s)}
                                            className={cn(
                                                "px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors",
                                                logStatus === s
                                                    ? "bg-primary text-white"
                                                    : "border border-border text-muted-foreground hover:text-foreground hover:bg-accent"
                                            )}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => refetchLogs()}>
                                    <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
                                </Button>
                                <Button variant="outline" size="sm" onClick={exportLogs}>
                                    <Download className="w-3.5 h-3.5 mr-1.5" /> Export
                                </Button>
                            </div>
                        </div>
                        <Table>
                            <TableHeader>
                                <TableRow className="border-border hover:bg-transparent">
                                    <TableHead className="text-xs uppercase font-semibold">Log ID</TableHead>
                                    <TableHead className="text-xs uppercase font-semibold">Channel</TableHead>
                                    <TableHead className="text-xs uppercase font-semibold">Status</TableHead>
                                    <TableHead className="text-xs uppercase font-semibold">Provider</TableHead>
                                    <TableHead className="text-xs uppercase font-semibold">Opened</TableHead>
                                    <TableHead className="text-xs uppercase font-semibold">Clicked</TableHead>
                                    <TableHead className="text-xs uppercase font-semibold">Retries</TableHead>
                                    <TableHead className="text-xs uppercase font-semibold">Sent</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logsLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i} className="animate-pulse border-border">
                                            {Array.from({ length: 8 }).map((_, j) => (
                                                <TableCell key={j}><div className="h-5 bg-accent rounded" /></TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : (logs ?? []).length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center text-muted-foreground py-12 italic">
                                            No logs {logStatus !== "all" ? `with status "${logStatus}"` : "yet"}. Send your first broadcast!
                                        </TableCell>
                                    </TableRow>
                                ) : (logs ?? []).map((log) => {
                                    const chCfg = CHANNELS.find((c) => c.key === log.channel);
                                    return (
                                        <TableRow
                                            key={log.id}
                                            className={cn(
                                                "border-border transition-colors",
                                                log.status === "failed" ? "bg-red-50/30 hover:bg-red-50/50" : "hover:bg-accent/20"
                                            )}
                                        >
                                            <TableCell>
                                                <code className="text-[10px] font-mono text-muted-foreground">{log.id.slice(0, 8)}</code>
                                            </TableCell>
                                            <TableCell>
                                                {chCfg ? (
                                                    <div className={cn("flex items-center gap-1.5 w-fit px-2 py-1 rounded-lg border text-[10px] font-medium", chCfg.color)}>
                                                        <chCfg.icon className="w-3 h-3" /> {chCfg.label}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">{log.channel}</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={cn("text-[10px] capitalize", LOG_STATUS_COLOR[log.status])}>
                                                    {log.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground capitalize">{log.provider ?? "—"}</TableCell>
                                            <TableCell>
                                                {log.opened_at ? (
                                                    <div className="flex items-center gap-1 text-[10px] text-emerald-600">
                                                        <Eye className="w-3 h-3" /> {format(new Date(log.opened_at), "h:mm a")}
                                                    </div>
                                                ) : <span className="text-[10px] text-muted-foreground">—</span>}
                                            </TableCell>
                                            <TableCell>
                                                {log.clicked_at ? (
                                                    <div className="flex items-center gap-1 text-[10px] text-blue-600">
                                                        <MousePointer className="w-3 h-3" /> {format(new Date(log.clicked_at), "h:mm a")}
                                                    </div>
                                                ) : <span className="text-[10px] text-muted-foreground">—</span>}
                                            </TableCell>
                                            <TableCell>
                                                <span className={cn("text-xs font-medium", log.retry_count > 0 ? "text-amber-600" : "text-muted-foreground")}>
                                                    {log.retry_count}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-[10px] text-muted-foreground">
                                                {log.sent_at ? format(new Date(log.sent_at), "MMM d, h:mm a") : "—"}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Schedule Dialog */}
            <Dialog open={schedDialog} onOpenChange={setSchedDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-primary" /> Schedule Notification
                        </DialogTitle>
                    </DialogHeader>
                    <ScheduleForm onSuccess={() => setSchedDialog(false)} />
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default NotificationCenter;
