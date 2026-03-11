import { Link } from "react-router-dom";
import { 
  Smartphone, Tv, Zap, MessageSquare, GraduationCap, 
  CreditCard, ChevronRight, Globe, Shield, Landmark
} from "lucide-react";
import { cn } from "@/lib/utils";

const services = [
  { icon: Smartphone, label: "Airtime", description: "Instant top-up for all networks", path: "/services/airtime", color: "text-primary bg-primary/10", border: "border-primary/20" },
  { icon: Smartphone, label: "Data Bundle", description: "Cheap data for all devices", path: "/services/data", color: "text-blue-600 bg-blue-50", border: "border-blue-100" },
  { icon: CreditCard, label: "Data Card", description: "Generate and print data PINs", path: "/services/data-card", color: "text-purple-600 bg-purple-50", border: "border-purple-100" },
  { icon: Tv, label: "Cable TV", description: "DSTV, GOTV & StarTimes", path: "/services/cable", color: "text-orange-600 bg-orange-50", border: "border-orange-100" },
  { icon: Zap, label: "Electricity", description: "Pay for prepaid & postpaid meters", path: "/services/electricity", color: "text-accent-foreground bg-accent/15", border: "border-accent/20" },
  { icon: Globe, label: "Int'l Airtime", description: "International top-up & data", path: "/services/intl-airtime", color: "text-indigo-600 bg-indigo-50", border: "border-indigo-100" },
  { icon: Shield, label: "Insurance", description: "Motor & personal accident cover", path: "/services/insurance", color: "text-teal-600 bg-teal-50", border: "border-teal-100" },
  { icon: MessageSquare, label: "Bulk SMS", description: "Send messages to multiple contacts", path: "/services/sms", color: "text-pink-600 bg-pink-50", border: "border-pink-100" },
  { icon: GraduationCap, label: "Edu Pins", description: "WAEC, NECO & JAMB pins", path: "/services/edu", color: "text-emerald-600 bg-emerald-50", border: "border-emerald-100" },
  { icon: Landmark, label: "Bank Transfer", description: "Send money to any bank", path: "#", color: "text-muted-foreground bg-muted/50", border: "border-muted", disabled: true },
];

const Services = () => {
  return (
    <div className="min-h-screen bg-secondary/30 pb-24">
      <div className="gradient-hero px-4 py-8 mb-6">
        <div className="container mx-auto">
          <h1 className="text-xl font-bold text-primary-foreground">Our Services</h1>
          <p className="text-primary-foreground/70 text-sm mt-1">Fast and reliable utility payments</p>
        </div>
      </div>

      <div className="container mx-auto px-4 space-y-4">
        <div className="grid grid-cols-1 gap-3">
          {services.map((service) => (
            <Link 
              key={service.path} 
              to={service.path}
              className="fintech-card p-4 flex items-center justify-between group hover:border-primary/30 transition-all active:scale-[0.98] tap-target"
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center border transition-transform group-hover:scale-110",
                  service.color,
                  service.border
                )}>
                  <service.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">{service.label}</h3>
                  <p className="text-[11px] text-muted-foreground">{service.description}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Services;
