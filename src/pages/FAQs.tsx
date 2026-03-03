import { useState } from "react";
import { Link } from "react-router-dom";
import { HelpCircle, ChevronRight, ChevronDown, MessageSquare, Mail, Smartphone, Gift, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const faqCategories = [
    { id: "general", label: "General", icon: HelpCircle },
    { id: "wallet", label: "Wallet & Funding", icon: Smartphone },
    { id: "services", label: "Services & Bills", icon: MessageSquare },
    { id: "referrals", label: "Referrals & Bonuses", icon: Gift },
];

const faqs = [
    {
        category: "general",
        question: "What is UteelPay?",
        answer: "UteelPay is a premium utility payment platform that allows you to buy airtime, data, pay electricity bills, cable TV, and more with ease and rewards."
    },
    {
        category: "wallet",
        question: "How do I fund my wallet?",
        answer: "You can fund your wallet by clicking the 'Add Money' button on your dashboard. You can pay via Paystack using card, bank transfer, or USSD. Your wallet is credited instantly."
    },
    {
        category: "wallet",
        question: "Is there a minimum funding amount?",
        answer: "Yes, the minimum funding amount is ₦100."
    },
    {
        category: "services",
        question: "My transaction is 'Pending', what should I do?",
        answer: "Pending transactions are usually processed within 5-10 minutes. If it stays pending for more than an hour, please contact our support team with your transaction ID."
    },
    {
        category: "referrals",
        question: "How does the referral system work?",
        answer: "For every person you refer who joins and makes a transaction, you earn a commission. You can view your referral link and earnings in the 'Referral' section of your dashboard."
    },
    {
        category: "services",
        question: "What is a Data Card?",
        answer: "A Data Card is a printed or digital voucher that contains a data pin. You can purchase it and share the pin with someone else to be loaded on their network."
    },
];

const FAQs = () => {
    const [activeCategory, setActiveCategory] = useState("general");
    const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

    const filteredFaqs = faqs.filter(f => f.category === activeCategory);

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] pb-24">
            {/* Hero Header */}
            <div className="bg-primary pt-12 pb-20 px-6 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
                <div className="container mx-auto relative z-10 text-center max-w-3xl">
                    <Badge className="bg-white/20 text-white border-none mb-4 px-4 py-1">Support Center</Badge>
                    <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-4">How can we help you?</h1>
                    <p className="text-white/70 text-sm font-medium leading-relaxed">Find answers to frequently asked questions or reach out to our team.</p>
                </div>
            </div>

            <div className="container mx-auto px-4 -mt-10 relative z-20">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Categories Sidebar */}
                    <div className="space-y-2">
                        {faqCategories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={cn(
                                    "w-full flex items-center justify-between p-4 rounded-2xl transition-all font-bold text-sm",
                                    activeCategory === cat.id
                                        ? "bg-white dark:bg-slate-800 shadow-xl shadow-primary/5 text-primary border-r-4 border-primary"
                                        : "bg-white/50 dark:bg-slate-900/50 text-muted-foreground hover:bg-white dark:hover:bg-slate-800"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <cat.icon className="w-4 h-4" />
                                    {cat.label}
                                </div>
                                <ChevronRight className={cn("w-4 h-4 transition-transform", activeCategory === cat.id ? "rotate-90 text-primary" : "text-muted-foreground")} />
                            </button>
                        ))}

                        <div className="mt-8 p-6 rounded-3xl bg-accent text-white shadow-xl shadow-accent/20 relative overflow-hidden group">
                            <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-white/10 rounded-full group-hover:scale-125 transition-transform" />
                            <h3 className="text-lg font-black mb-2 tracking-tight">Still stuck?</h3>
                            <p className="text-white/80 text-[10px] font-medium mb-6 leading-relaxed">Our support heroes are ready to help you 24/7.</p>
                            <a href="https://wa.me/2347036006762" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-full py-3 bg-white text-accent rounded-xl text-xs font-black shadow-lg hover:bg-white/90 transition-all gap-2">
                                Chat Support <MessageSquare className="w-4 h-4" />
                            </a>
                        </div>
                    </div>

                    {/* FAQ Content */}
                    <div className="lg:col-span-3 space-y-4">
                        {filteredFaqs.map((faq, index) => (
                            <div
                                key={index}
                                className="bg-white dark:bg-slate-800 rounded-3xl border border-border/50 shadow-sm overflow-hidden"
                            >
                                <button
                                    onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                                    className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                                >
                                    <span className="font-black text-sm text-foreground tracking-tight pr-8">{faq.question}</span>
                                    <div className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                                        expandedIndex === index ? "bg-primary text-white rotate-180" : "bg-secondary text-muted-foreground"
                                    )}>
                                        <ChevronDown className="w-4 h-4" />
                                    </div>
                                </button>
                                <div className={cn(
                                    "px-6 transition-all duration-300 ease-in-out overflow-hidden",
                                    expandedIndex === index ? "max-h-96 pb-6 opacity-100" : "max-h-0 opacity-0"
                                )}>
                                    <div className="pt-2 text-xs font-medium text-muted-foreground leading-relaxed">
                                        {faq.answer}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {filteredFaqs.length === 0 && (
                            <div className="bg-white dark:bg-slate-800 rounded-3xl p-16 text-center border border-dashed border-border">
                                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                                    <HelpCircle className="w-8 h-8 text-muted-foreground opacity-20" />
                                </div>
                                <p className="font-bold text-muted-foreground italic">No questions in this category yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FAQs;
