import { Link } from "react-router-dom";
import { useEffect, useRef, ReactNode } from "react";
import logo from "@/assets/logo.png";
import heroBillPayment from "@/assets/hero-bill-payment.jpg";
import heroBillPayment2 from "@/assets/hero-bill-payment-2.jpg";
import appMockup from "@/assets/app-mockup.png";
import {
  Zap, Shield, Clock, Star, Smartphone, Tv, GraduationCap,
  MessageSquare, Users, ArrowRight, Phone, Gift, HelpCircle, CheckCircle,
  TrendingDown, Percent, BadgeDollarSign, Download, Quote
} from "lucide-react";
import { Button } from "@/components/ui/button";

/* ---------------- Scroll Reveal Wrapper ---------------- */
const ScrollReveal = ({ children, className = "" }: { children: ReactNode; className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("opacity-100", "translate-y-0");
          el.classList.remove("opacity-0", "translate-y-8");
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`opacity-0 translate-y-8 transition-all duration-700 ease-out ${className}`}>
      {children}
    </div>
  );
};

/* ---------------- Responsive Navbar ---------------- */
const Navbar = () => (
  <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/30">
    <div className="max-w-7xl mx-auto flex items-center justify-between h-14 lg:h-16 px-4 lg:px-8">
      <Link to="/" className="flex items-center gap-2">
        <img src={logo} alt="Uteelpay" className="h-10 lg:h-12 w-auto" />
        <span className="text-lg lg:text-xl font-extrabold text-gradient tracking-tight">Uteelpay</span>
      </Link>
      <div className="hidden lg:flex items-center gap-8 text-sm font-medium text-muted-foreground">
        <a href="#about" className="hover:text-foreground transition-colors">About</a>
        <a href="#services" className="hover:text-foreground transition-colors">Services</a>
        <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
        <a href="#testimonials" className="hover:text-foreground transition-colors">Reviews</a>
        <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
        <a href="#faqs" className="hover:text-foreground transition-colors">FAQs</a>
      </div>
      <div className="flex items-center gap-2 lg:gap-3">
        <Link to="/login"><Button variant="ghost" size="sm" className="text-xs lg:text-sm font-semibold h-9 lg:h-10 px-3 lg:px-5">Login</Button></Link>
        <Link to="/signup"><Button size="sm" className="gradient-primary text-primary-foreground text-xs lg:text-sm font-bold h-9 lg:h-10 px-4 lg:px-6 rounded-xl">Register</Button></Link>
      </div>
    </div>
  </nav>
);

/* ---------------- Hero Section ---------------- */
const services = [
  { icon: Smartphone, label: "Airtime", path: "/services/airtime", color: "bg-primary/10 text-primary" },
  { icon: Smartphone, label: "Data", path: "/services/data", color: "bg-blue-100 text-blue-600" },
  { icon: Tv, label: "Cable TV", path: "/services/cable", color: "bg-orange-100 text-orange-600" },
  { icon: Zap, label: "Electricity", path: "/services/electricity", color: "bg-accent/15 text-accent-foreground" },
  { icon: MessageSquare, label: "Bulk SMS", path: "/services/sms", color: "bg-pink-100 text-pink-600" },
  { icon: GraduationCap, label: "Edu Pins", path: "/services/edu", color: "bg-emerald-100 text-emerald-600" },
];

const HeroSection = () => (
  <section className="pt-[72px] lg:pt-[100px] pb-8 lg:pb-16 px-4 lg:px-8">
    <div className="max-w-[420px] lg:max-w-7xl mx-auto text-center lg:text-left">
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] lg:text-xs font-bold mb-4 animate-fade-in">
        <Star className="w-3 h-3 text-accent" />
        Nigeria's Trusted Platform
      </div>
      <h1 className="text-2xl lg:text-5xl xl:text-6xl font-extrabold leading-tight mb-3 lg:mb-5 text-foreground animate-slide-up">
        Fast Utility <span className="text-gradient">Payments</span>
      </h1>
      <p className="text-sm lg:text-lg text-muted-foreground mb-5 lg:mb-8 max-w-xs lg:max-w-md mx-auto lg:mx-0 animate-slide-up" style={{ animationDelay: "0.1s" }}>
        Instant Airtime, Data, Electricity & more — zero hidden fees. Trusted by thousands of Nigerians.
      </p>
      <div className="flex gap-3 max-w-xs lg:max-w-sm mx-auto lg:mx-0 animate-slide-up" style={{ animationDelay: "0.2s" }}>
        <Link to="/signup" className="flex-1">
          <Button className="w-full gradient-primary text-primary-foreground font-bold h-12 lg:h-14 rounded-2xl text-sm lg:text-base hover-lift">
            Get Started <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
        <Link to="/login" className="flex-1">
          <Button variant="outline" className="w-full h-12 lg:h-14 rounded-2xl text-sm lg:text-base font-semibold border-2 border-primary/20 text-primary hover:bg-primary/5 hover-lift">
            Login
          </Button>
        </Link>
      </div>
    </div>
  </section>
);

/* ---------------- Services Grid ---------------- */
const ServicesGrid = () => (
  <section id="services" className="py-8 lg:py-16 px-4 lg:px-8">
    <div className="max-w-[420px] lg:max-w-7xl mx-auto">
      <h2 className="text-lg lg:text-3xl font-extrabold text-center mb-2 lg:mb-3 text-foreground">Our Services</h2>
      <p className="text-xs lg:text-base text-muted-foreground text-center mb-5 lg:mb-10">Everything you need to stay connected and powered</p>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-5 max-w-xs lg:max-w-none mx-auto">
        {services.map((service, i) => (
          <Link key={i} to={service.path}>
            <div className="fintech-card p-4 lg:p-6 tap-target hover:scale-[1.03] transition-all">
              <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl ${service.color} flex items-center justify-center mb-2 mx-auto`}>
                <service.icon className="w-5 h-5 lg:w-6 lg:h-6" />
              </div>
              <p className="text-xs lg:text-sm font-bold text-foreground text-center">{service.label}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  </section>
);

/* ---------------- Features Row ---------------- */
const features = [
  { icon: Shield, title: "Secure", desc: "Bank-grade encryption on every transaction" },
  { icon: Clock, title: "Instant", desc: "Processing under 5 seconds guaranteed" },
  { icon: Zap, title: "Reliable", desc: "24/7 uptime so you never miss a payment" },
];

const FeaturesSection = () => (
  <section className="py-6 lg:py-14 px-4 lg:px-8 bg-secondary/50">
    <div className="max-w-[420px] lg:max-w-7xl mx-auto">
      <div className="grid grid-cols-3 gap-2 lg:gap-8">
        {features.map((f, i) => (
          <div key={i} className="fintech-card p-3 lg:p-8 text-center">
            <div className="w-9 h-9 lg:w-14 lg:h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2 lg:mb-4 mx-auto">
              <f.icon className="w-4 h-4 lg:w-7 lg:h-7" />
            </div>
            <h3 className="text-xs lg:text-base font-bold text-foreground mb-0.5 lg:mb-2">{f.title}</h3>
            <p className="text-[10px] lg:text-sm text-muted-foreground hidden lg:block">{f.desc}</p>
            <p className="text-[10px] text-muted-foreground lg:hidden">{f.title === "Secure" ? "Bank-grade security" : f.title === "Instant" ? "Under 5 seconds" : "24/7 availability"}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ---------------- Bill Payment Showcase ---------------- */
const BillPaymentShowcase = () => (
  <section className="py-8 lg:py-20 px-4 lg:px-8">
    <div className="max-w-[420px] lg:max-w-7xl mx-auto">
      <div className="text-center mb-6 lg:mb-12">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 text-accent-foreground text-[11px] lg:text-xs font-bold mb-3">
          <BadgeDollarSign className="w-3 h-3" /> Save More With Every Payment
        </div>
        <h2 className="text-xl lg:text-4xl font-extrabold text-foreground mb-2 lg:mb-3">
          Pay Your Bills <span className="text-gradient">Effortlessly</span>
        </h2>
        <p className="text-xs lg:text-base text-muted-foreground max-w-md mx-auto">
          From airtime to electricity, Uteelpay gives you the best rates with instant delivery — saving you money on every transaction.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
        {/* Image Card 1 */}
        <div className="relative rounded-3xl overflow-hidden group">
          <img src={heroBillPayment} alt="Woman paying bills on Uteelpay" className="w-full h-48 lg:h-80 object-cover group-hover:scale-105 transition-transform duration-500" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-6">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/90 text-primary-foreground text-[10px] lg:text-xs font-bold mb-2">
              <TrendingDown className="w-3 h-3" /> Up to 4% Discount
            </div>
            <h3 className="text-sm lg:text-xl font-extrabold text-white mb-0.5">Buy Airtime & Data</h3>
            <p className="text-[10px] lg:text-sm text-white/70">All networks at the cheapest rates in Nigeria</p>
          </div>
        </div>

        {/* Image Card 2 */}
        <div className="relative rounded-3xl overflow-hidden group">
          <img src={heroBillPayment2} alt="Man paying electricity bills" className="w-full h-48 lg:h-80 object-cover group-hover:scale-105 transition-transform duration-500" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-6">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/90 text-accent-foreground text-[10px] lg:text-xs font-bold mb-2">
              <Zap className="w-3 h-3" /> Instant Token
            </div>
            <h3 className="text-sm lg:text-xl font-extrabold text-white mb-0.5">Electricity & Cable TV</h3>
            <p className="text-[10px] lg:text-sm text-white/70">Pay your utility bills in seconds, 24/7</p>
          </div>
        </div>
      </div>

      {/* Savings highlights */}
      <div className="grid grid-cols-3 gap-2 lg:gap-6 mt-4 lg:mt-8">
        {[
          { icon: Percent, label: "Best Rates", value: "Cheapest prices" },
          { icon: TrendingDown, label: "Zero Fees", value: "No hidden charges" },
          { icon: BadgeDollarSign, label: "Save More", value: "Up to 4% off" },
        ].map((item, i) => (
          <div key={i} className="fintech-card p-3 lg:p-5 text-center">
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-accent/10 text-accent-foreground flex items-center justify-center mx-auto mb-1.5 lg:mb-3">
              <item.icon className="w-4 h-4 lg:w-5 lg:h-5" />
            </div>
            <p className="text-[10px] lg:text-sm font-bold text-foreground">{item.label}</p>
            <p className="text-[9px] lg:text-xs text-muted-foreground">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ---------------- About Section ---------------- */
const AboutSection = () => (
  <section id="about" className="py-8 lg:py-20 px-4 lg:px-8 bg-secondary/50">
    <div className="max-w-[420px] lg:max-w-7xl mx-auto">
      <div className="lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 text-accent-foreground text-[11px] lg:text-xs font-bold mb-3 lg:mb-4">
            <Star className="w-3 h-3" /> The Uteelpay Story
          </div>
          <h2 className="text-xl lg:text-4xl font-extrabold mb-3 lg:mb-5 text-foreground">
            We power <span className="text-gradient">possibilities.</span>
          </h2>
          <div className="space-y-3 text-sm lg:text-base text-muted-foreground leading-relaxed">
            <p>What if paying your everyday bills felt as effortless as sending a text? That's why we built <strong className="text-foreground">Uteelpay</strong>.</p>
            <p>From ensuring a student gets their WAEC pin at 2 AM, to keeping households powered across Nigeria — we deliver speed, security, and zero hidden charges.</p>
          </div>
        </div>
        <div className="hidden lg:block">
          <div className="space-y-4">
            {[
              "Instant delivery on all services",
              "Zero hidden fees or charges",
              "Trusted by 10,000+ Nigerians",
              "24/7 WhatsApp support",
              "Bank-grade security & encryption",
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-3 text-sm font-medium text-foreground">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-4 h-4 text-primary" />
                </div>
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
);

/* ---------------- How It Works ---------------- */
const steps = [
  { num: "1", title: "Sign Up", desc: "Create your account in seconds — it's free" },
  { num: "2", title: "Fund Wallet", desc: "Add money via Bank Transfer or Card" },
  { num: "3", title: "Pay Bills", desc: "Select a service and pay instantly" },
];

const HowItWorks = () => (
  <section id="how-it-works" className="py-8 lg:py-20 px-4 lg:px-8">
    <div className="max-w-[420px] lg:max-w-7xl mx-auto">
      <h2 className="text-lg lg:text-3xl font-extrabold text-center mb-2 lg:mb-3 text-foreground">How It Works</h2>
      <p className="text-xs lg:text-base text-muted-foreground text-center mb-5 lg:mb-10 hidden lg:block">Get started in three simple steps</p>
      <div className="grid grid-cols-3 gap-2 lg:gap-8">
        {steps.map((s, i) => (
          <div key={i} className="fintech-card p-3 lg:p-8 text-center">
            <div className="w-9 h-9 lg:w-14 lg:h-14 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-2 lg:mb-4 text-primary-foreground text-xs lg:text-lg font-bold">
              {s.num}
            </div>
            <h3 className="text-xs lg:text-base font-bold text-foreground mb-1 lg:mb-2">{s.title}</h3>
            <p className="text-[10px] lg:text-sm text-muted-foreground">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ---------------- Testimonials ---------------- */
const testimonials = [
  {
    name: "Chioma A.",
    role: "Business Owner",
    text: "I save over ₦3,000 monthly buying airtime and data on Uteelpay. The discounts are real and the delivery is instant!",
    rating: 5,
  },
  {
    name: "Emeka O.",
    role: "Student",
    text: "Bought my WAEC pin at 2 AM without stress. This app is a lifesaver for students. Super affordable too!",
    rating: 5,
  },
  {
    name: "Fatima M.",
    role: "Freelancer",
    text: "I've tried many VTU platforms but Uteelpay gives the best rates. The referral bonus is also amazing — I've earned over ₦5,000!",
    rating: 5,
  },
  {
    name: "David K.",
    role: "Entrepreneur",
    text: "Paying electricity and cable TV bills used to be a hassle. With Uteelpay, it's done in under 5 seconds. Incredible.",
    rating: 5,
  },
];

const TestimonialsSection = () => (
  <section id="testimonials" className="py-8 lg:py-20 px-4 lg:px-8 bg-secondary/50">
    <div className="max-w-[420px] lg:max-w-7xl mx-auto">
      <div className="text-center mb-5 lg:mb-12">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] lg:text-xs font-bold mb-3">
          <Users className="w-3 h-3" /> What Our Users Say
        </div>
        <h2 className="text-lg lg:text-3xl font-extrabold text-foreground mb-1 lg:mb-2">Loved by Thousands</h2>
        <p className="text-xs lg:text-base text-muted-foreground">Real stories from real Nigerians saving money every day</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5">
        {testimonials.map((t, i) => (
          <div key={i} className="fintech-card p-4 lg:p-6 relative">
            <Quote className="w-6 h-6 lg:w-8 lg:h-8 text-primary/10 absolute top-3 right-3 lg:top-5 lg:right-5" />
            <div className="flex gap-0.5 mb-2 lg:mb-3">
              {Array.from({ length: t.rating }).map((_, j) => (
                <Star key={j} className="w-3 h-3 lg:w-4 lg:h-4 fill-accent text-accent" />
              ))}
            </div>
            <p className="text-[11px] lg:text-sm text-muted-foreground leading-relaxed mb-3 lg:mb-4">{t.text}</p>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 lg:w-9 lg:h-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-[10px] lg:text-xs font-bold shrink-0">
                {t.name[0]}
              </div>
              <div>
                <p className="text-[11px] lg:text-sm font-bold text-foreground">{t.name}</p>
                <p className="text-[9px] lg:text-xs text-muted-foreground">{t.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ---------------- Referral Banner ---------------- */
const ReferralBanner = () => (
  <section className="py-6 lg:py-16 px-4 lg:px-8">
    <div className="max-w-[420px] lg:max-w-7xl mx-auto">
      <div className="fintech-card p-5 lg:p-12 bg-accent/5 border-accent/20 text-center">
        <Gift className="w-8 h-8 lg:w-12 lg:h-12 text-accent mx-auto mb-2 lg:mb-4" />
        <h3 className="text-base lg:text-2xl font-extrabold text-foreground mb-1 lg:mb-2">Refer & Earn</h3>
        <p className="text-xs lg:text-base text-muted-foreground mb-3 lg:mb-6 max-w-md mx-auto">Invite friends and earn amazing bonuses as they transact!</p>
        <Link to="/signup">
          <Button className="btn-gold h-11 lg:h-13 rounded-xl text-sm lg:text-base font-bold px-6 lg:px-10">Start Earning <ArrowRight className="w-3.5 h-3.5 lg:w-4 lg:h-4 ml-1" /></Button>
        </Link>
      </div>
    </div>
  </section>
);

/* ---------------- Pricing ---------------- */
const pricingData = [
  { name: "Airtime", price: "From ₦50", desc: "Up to 4% discount" },
  { name: "Data", price: "From ₦200", desc: "All networks, best rates" },
  { name: "Cable TV", price: "From ₦1,300", desc: "DSTV, GOtv, StarTimes" },
  { name: "Electricity", price: "From ₦500", desc: "All DISCOs" },
  { name: "Bulk SMS", price: "₦2.5/SMS", desc: "Send to thousands" },
  { name: "Edu Pins", price: "From ₦1,800", desc: "WAEC & NECO" },
];

const PricingSection = () => (
  <section id="pricing" className="py-8 lg:py-20 px-4 lg:px-8 bg-secondary/50">
    <div className="max-w-[420px] lg:max-w-7xl mx-auto">
      <h2 className="text-lg lg:text-3xl font-extrabold text-center mb-1 lg:mb-2 text-foreground">Affordable Pricing</h2>
      <p className="text-xs lg:text-base text-muted-foreground text-center mb-5 lg:mb-10">No hidden charges. Best rates guaranteed.</p>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-5">
        {pricingData.map((s, i) => (
          <div key={i} className="fintech-card p-3 lg:p-6">
            <h3 className="text-xs lg:text-sm font-bold text-foreground mb-0.5 lg:mb-1">{s.name}</h3>
            <p className="text-base lg:text-2xl font-extrabold text-gradient mb-0.5 lg:mb-1">{s.price}</p>
            <p className="text-[10px] lg:text-sm text-muted-foreground">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ---------------- Download App CTA ---------------- */
const DownloadAppSection = () => (
  <section className="py-8 lg:py-20 px-4 lg:px-8">
    <div className="max-w-[420px] lg:max-w-7xl mx-auto">
      <div className="fintech-card p-5 lg:p-0 lg:overflow-hidden lg:grid lg:grid-cols-2 lg:items-center bg-gradient-to-br from-primary/5 via-background to-accent/5 border-primary/10">
        {/* Text side */}
        <div className="lg:p-12 text-center lg:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] lg:text-xs font-bold mb-3">
            <Download className="w-3 h-3" /> Coming Soon
          </div>
          <h2 className="text-lg lg:text-3xl font-extrabold text-foreground mb-2 lg:mb-3">
            Get the <span className="text-gradient">Uteelpay App</span>
          </h2>
          <p className="text-xs lg:text-base text-muted-foreground mb-4 lg:mb-6 max-w-sm mx-auto lg:mx-0">
            Pay bills on the go. Download the Uteelpay mobile app for an even faster, smoother experience with exclusive app-only deals.
          </p>
          <div className="flex gap-3 justify-center lg:justify-start">
            <Button className="gradient-primary text-primary-foreground font-bold h-11 lg:h-12 rounded-xl text-xs lg:text-sm px-5 lg:px-6 hover-lift gap-2">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M17.523 2.228a.667.667 0 00-.789.098L3.726 12l6.504 4.886 7.293-14.658zm-.828 18.545L5.426 13.576l-.89.668 10.78 8.107a.667.667 0 00.38.12.667.667 0 00.6-.372l.4-.803V20.773zm2.305-8.79l-2.87-1.643L12.87 17.5l3.26 2.45 2.87-5.767a.667.667 0 000-.6zM4.174 12L2.5 13.257v-2.514L4.174 12z"/></svg>
              Google Play
            </Button>
            <Button variant="outline" className="font-bold h-11 lg:h-12 rounded-xl text-xs lg:text-sm px-5 lg:px-6 border-2 border-primary/20 text-primary hover:bg-primary/5 hover-lift gap-2">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
              App Store
            </Button>
          </div>
        </div>

        {/* App mockup side */}
        <div className="mt-6 lg:mt-0 flex justify-center">
          <img src={appMockup} alt="Uteelpay bill payment app" className="w-56 lg:w-80 drop-shadow-2xl" />
        </div>
      </div>
    </div>
  </section>
);

/* ---------------- FAQs ---------------- */
const faqs = [
  { q: "How fast are top-ups?", a: "Most transactions process instantly — under 5 seconds." },
  { q: "Is Uteelpay secure?", a: "Yes. We use bank-grade encryption and Paystack gateway." },
  { q: "What if I have an issue?", a: "Our support team is available 24/7 via WhatsApp and email." },
];

const FAQSection = () => (
  <section id="faqs" className="py-8 lg:py-20 px-4 lg:px-8">
    <div className="max-w-[420px] lg:max-w-3xl mx-auto">
      <h2 className="text-lg lg:text-3xl font-extrabold text-center mb-5 lg:mb-10 text-foreground">FAQs</h2>
      <div className="space-y-3 lg:space-y-4">
        {faqs.map((f, i) => (
          <div key={i} className="fintech-card p-4 lg:p-6">
            <h3 className="text-xs lg:text-base font-bold text-foreground mb-1 lg:mb-2 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 lg:w-5 lg:h-5 text-primary shrink-0" /> {f.q}
            </h3>
            <p className="text-[11px] lg:text-sm text-muted-foreground leading-relaxed pl-6 lg:pl-7">{f.a}</p>
          </div>
        ))}
      </div>
      <div className="text-center mt-4 lg:mt-8">
        <Link to="/faqs">
          <Button variant="ghost" size="sm" className="text-xs lg:text-sm text-primary font-bold gap-1">
            View Full Help Center <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>
    </div>
  </section>
);

/* ---------------- Trust Bar ---------------- */
const TrustBar = () => (
  <section className="py-6 lg:py-12 px-4 lg:px-8 border-t border-border/30">
    <div className="max-w-[420px] lg:max-w-5xl mx-auto">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
        {[
          { icon: Shield, text: "Secure Payments", color: "text-primary" },
          { icon: Zap, text: "Instant Delivery", color: "text-accent" },
          { icon: Users, text: "10,000+ Users", color: "text-primary" },
          { icon: Phone, text: "24/7 Support", color: "text-accent" },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-2 lg:gap-3 text-xs lg:text-sm font-semibold text-muted-foreground justify-center">
            <item.icon className={`w-4 h-4 lg:w-5 lg:h-5 ${item.color}`} /> {item.text}
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ---------------- Footer ---------------- */
const Footer = () => (
  <footer className="py-6 lg:py-12 px-4 lg:px-8 border-t border-border/30 bg-card">
    <div className="max-w-[420px] lg:max-w-5xl mx-auto">
      <div className="hidden lg:grid lg:grid-cols-4 gap-8 mb-8">
        <div>
          <p className="font-extrabold text-gradient text-xl mb-3 flex items-center justify-center gap-2"><img src={logo} alt="Uteelpay" className="h-10 w-auto" /> Uteelpay</p>
          <p className="text-sm text-muted-foreground leading-relaxed">Nigeria's trusted platform for fast utility payments with zero hidden fees.</p>
        </div>
        <div>
          <h4 className="text-sm font-bold text-foreground mb-3">Services</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <a href="#services" className="block hover:text-primary transition-colors">Airtime</a>
            <a href="#services" className="block hover:text-primary transition-colors">Data</a>
            <a href="#services" className="block hover:text-primary transition-colors">Cable TV</a>
            <a href="#services" className="block hover:text-primary transition-colors">Electricity</a>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-bold text-foreground mb-3">Company</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <a href="#about" className="block hover:text-primary transition-colors">About Us</a>
            <Link to="/faqs" className="block hover:text-primary transition-colors">FAQs</Link>
            <a href="#pricing" className="block hover:text-primary transition-colors">Pricing</a>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-bold text-foreground mb-3">Get Started</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <Link to="/signup" className="block hover:text-primary transition-colors">Create Account</Link>
            <Link to="/login" className="block hover:text-primary transition-colors">Login</Link>
          </div>
        </div>
      </div>

      <div className="lg:hidden text-center">
        <p className="font-extrabold text-gradient text-lg mb-3 flex items-center justify-center gap-2"><img src={logo} alt="Uteelpay" className="h-9 w-auto" /> Uteelpay</p>
        <div className="flex flex-wrap justify-center gap-4 text-[11px] font-semibold text-muted-foreground mb-4">
          <a href="#services" className="hover:text-primary">Services</a>
          <a href="#pricing" className="hover:text-primary">Pricing</a>
          <Link to="/faqs" className="hover:text-primary">FAQs</Link>
          <Link to="/signup" className="hover:text-primary">Create Account</Link>
        </div>
      </div>

      <p className="text-[10px] lg:text-xs text-muted-foreground text-center lg:pt-6 lg:border-t lg:border-border/30">© 2026 Uteelpay. All rights reserved.</p>
    </div>
  </footer>
);

/* ---------------- WhatsApp FAB ---------------- */
const WhatsAppButton = () => (
  <a
    href="https://wa.me/2349022334478"
    target="_blank"
    rel="noopener noreferrer"
    className="fixed bottom-5 right-5 z-50 w-12 h-12 rounded-full bg-[hsl(142,70%,45%)] flex items-center justify-center shadow-lg hover:bg-[hsl(142,70%,40%)] transition-colors"
    aria-label="WhatsApp Support"
  >
    <MessageSquare className="w-5 h-5 text-white" />
  </a>
);

/* ---------------- Landing Page ---------------- */
const Landing = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <HeroSection />
    <ScrollReveal><FeaturesSection /></ScrollReveal>
    <ScrollReveal><BillPaymentShowcase /></ScrollReveal>
    <ScrollReveal><AboutSection /></ScrollReveal>
    <ScrollReveal><HowItWorks /></ScrollReveal>
    <ScrollReveal><TestimonialsSection /></ScrollReveal>
    <ScrollReveal><ServicesGrid /></ScrollReveal>
    <ScrollReveal><ReferralBanner /></ScrollReveal>
    <ScrollReveal><PricingSection /></ScrollReveal>
    <ScrollReveal><DownloadAppSection /></ScrollReveal>
    <ScrollReveal><FAQSection /></ScrollReveal>
    <ScrollReveal><TrustBar /></ScrollReveal>
    <ScrollReveal><Footer /></ScrollReveal>
    <WhatsAppButton />
  </div>
);

export default Landing;
