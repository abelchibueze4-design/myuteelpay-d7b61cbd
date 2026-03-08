import { Link } from "react-router-dom";
import { useEffect, useRef, ReactNode } from "react";
import {
  Zap, Shield, Clock, Star, Smartphone, Tv, GraduationCap,
  MessageSquare, Users, ArrowRight, Phone, Gift, HelpCircle, CheckCircle
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
        <img src={logo} alt="Uteelpay" className="h-8 lg:h-9 w-auto" />
        <span className="text-lg lg:text-xl font-extrabold text-gradient tracking-tight">Uteelpay</span>
      </Link>
      <div className="hidden lg:flex items-center gap-8 text-sm font-medium text-muted-foreground">
        <a href="#about" className="hover:text-foreground transition-colors">About</a>
        <a href="#services" className="hover:text-foreground transition-colors">Services</a>
        <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
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
  <section id="services" className="pt-[72px] lg:pt-[100px] pb-8 lg:pb-16 px-4 lg:px-8">
    <div className="max-w-[420px] lg:max-w-6xl mx-auto">
      {/* Desktop: side-by-side layout */}
      <div className="lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center">
        {/* Left: Text content */}
        <div className="text-center lg:text-left">
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

          {/* CTA Buttons */}
          <div className="flex gap-3 mb-6 lg:mb-0 max-w-xs lg:max-w-sm mx-auto lg:mx-0 animate-slide-up" style={{ animationDelay: "0.2s" }}>
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

        {/* Right: Service Grid (visible on both mobile and desktop) */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4 max-w-xs lg:max-w-none mx-auto">
          {services.map((service, i) => (
            <Link key={i} to={service.path}>
              <div className="fintech-card p-4 lg:p-6 tap-target hover:scale-[1.03] transition-all animate-scale-in" style={{ animationDelay: `${i * 0.08}s` }}>
                <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-xl ${service.color} flex items-center justify-center mb-2 mx-auto`}>
                  <service.icon className="w-5 h-5 lg:w-6 lg:h-6" />
                </div>
                <p className="text-xs lg:text-sm font-bold text-foreground text-center">{service.label}</p>
              </div>
            </Link>
          ))}
        </div>
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
    <div className="max-w-[420px] lg:max-w-5xl mx-auto">
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

/* ---------------- About Section ---------------- */
const AboutSection = () => (
  <section id="about" className="py-8 lg:py-20 px-4 lg:px-8">
    <div className="max-w-[420px] lg:max-w-5xl mx-auto">
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
        {/* Desktop-only trust indicators */}
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
  <section id="how-it-works" className="py-8 lg:py-20 px-4 lg:px-8 bg-secondary/50">
    <div className="max-w-[420px] lg:max-w-5xl mx-auto">
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

/* ---------------- Referral Banner ---------------- */
const ReferralBanner = () => (
  <section className="py-6 lg:py-16 px-4 lg:px-8">
    <div className="max-w-[420px] lg:max-w-4xl mx-auto">
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
    <div className="max-w-[420px] lg:max-w-5xl mx-auto">
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
      {/* Desktop: multi-column footer */}
      <div className="hidden lg:grid lg:grid-cols-4 gap-8 mb-8">
        <div>
          <p className="font-extrabold text-gradient text-xl mb-3">Uteelpay</p>
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

      {/* Mobile: compact footer */}
      <div className="lg:hidden text-center">
        <p className="font-extrabold text-gradient text-lg mb-3">Uteelpay</p>
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
    <ScrollReveal><AboutSection /></ScrollReveal>
    <ScrollReveal><HowItWorks /></ScrollReveal>
    <ScrollReveal><ReferralBanner /></ScrollReveal>
    <ScrollReveal><PricingSection /></ScrollReveal>
    <ScrollReveal><FAQSection /></ScrollReveal>
    <ScrollReveal><TrustBar /></ScrollReveal>
    <ScrollReveal><Footer /></ScrollReveal>
    <WhatsAppButton />
  </div>
);

export default Landing;
