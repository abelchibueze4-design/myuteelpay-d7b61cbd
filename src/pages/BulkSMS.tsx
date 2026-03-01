import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MessageSquare, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const BulkSMS = () => {
  const navigate = useNavigate();
  const [sender, setSender] = useState("");
  const [recipients, setRecipients] = useState("");
  const [message, setMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const recipientCount = recipients.split(",").filter((r) => r.trim()).length;
  const charCount = message.length;

  return (
    <div className="min-h-screen bg-secondary">
      <header className="gradient-hero px-4 py-6">
        <div className="container mx-auto flex items-center gap-3">
          <button onClick={() => navigate("/dashboard")} className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-primary-foreground" />
          </button>
          <h1 className="text-lg font-bold text-primary-foreground">Bulk SMS</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 -mt-2">
        <form onSubmit={(e) => { e.preventDefault(); setShowSuccess(true); }} className="bg-card rounded-2xl p-6 shadow-card space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Sender Name</label>
            <Input value={sender} onChange={(e) => setSender(e.target.value)} placeholder="Your brand name" maxLength={11} required />
            <p className="text-xs text-muted-foreground">Max 11 characters</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Recipients</label>
            <Textarea value={recipients} onChange={(e) => setRecipients(e.target.value)} placeholder="Enter numbers separated by commas" rows={3} required />
            <p className="text-xs text-muted-foreground">{recipientCount} recipient{recipientCount !== 1 ? "s" : ""}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Message</label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type your message here..." rows={4} maxLength={160} required />
            <p className="text-xs text-muted-foreground">{charCount}/160 characters</p>
          </div>

          <div className="bg-secondary rounded-lg p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cost per SMS</span>
              <span className="font-semibold">₦2.50</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-muted-foreground">Total Cost</span>
              <span className="font-bold text-gradient">₦{(recipientCount * 2.5).toFixed(2)}</span>
            </div>
          </div>

          <Button type="submit" variant="hero" className="w-full">Send Messages</Button>
        </form>
      </div>

      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="max-w-sm text-center">
          <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-primary-foreground" />
          </div>
          <h2 className="text-xl font-bold">Messages Sent!</h2>
          <p className="text-sm text-muted-foreground">{recipientCount} messages delivered successfully.</p>
          <Button variant="hero" className="w-full mt-4" onClick={() => navigate("/dashboard")}>Done</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BulkSMS;
