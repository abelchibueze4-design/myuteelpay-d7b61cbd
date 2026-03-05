import { Link } from "react-router-dom";
import {
  Zap, Shield, Clock, Star, Smartphone, Tv, GraduationCap,
  MessageSquare, Users, ArrowRight, Phone, Gift, HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";

/* ---------------- Mobile-First Navbar ---------------- */
const Navbar = () => (
  <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-border/30">
    <div className="max-w-[420px] lg:max-w-7xl mx-auto flex items-center justify-between h-14 px-4">
      <Link to="/" className="text-lg font-extrabold text-gradient tracking-tight">Uteelpay</Link>
      <div className="hidden lg:flex items-center gap-6 text-sm font-medium text-muted-foreground">
        <a href="#about" className="hover:text-foreground transition-colors">About</a>
        <a href="#services" className="hover:text-foreground transition-colors">Services</a>
        <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
        <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
      </div>
      <div className="flex items-center gap-2">
        <Link to="/login"><Button variant="ghost" size="sm" className="text-xs font-semibold h-9 px-3">Login</Button></Link>
        <Link to="/signup"><Button size="sm" className="gradient-primary text-primary-foreground text-xs font-bold h-9 px-4 rounded-xl">Register</Button></Link>
      </div>
    </div>
  </nav>
);

/* ---------------- Compact Hero Section ---------------- */
const services = [
  { icon: Smartphone, label: "Airtime", path: "/services/airtime", color: "bg-primary/10 text-primary" },
  { icon: Smartphone, label: "Data", path: "/services/data", color: "bg-blue-100 text-blue-600" },
  { icon: Tv, label: "Cable TV", path: "/services/cable", color: "bg-orange-100 text-orange-600" },
  { icon: Zap, label: "Electricity", path: "/services/electricity", color: "bg-accent/15 text-accent-foreground" },
  { icon: MessageSquare, label: "Bulk SMS", path: "/services/sms", color: "bg-pink-100 text-pink-600" },
  { icon: GraduationCap, label: "Edu Pins", path: "/services/edu", color: "bg-emerald-100 text-emerald-600" },
];

const HeroSection = () => (
  <section className="pt-[72px] pb-6 px-4">
    <div className="max-w-[420px] lg:max-w-4xl mx-auto text-center">
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-bold mb-4 animate-fade-in">
        <Star className="w-3 h-3 text-accent" />
        Nigeria's Trusted Platform
      </div>
      <h1 className="text-2xl lg:text-5xl font-extrabold leading-tight mb-2 text-foreground animate-slide-up">
        Fast Utility <span className="text-gradient">Payments</span>
      </h1>
      <p className="text-sm text-muted-foreground mb-5 max-w-xs mx-auto animate-slide-up" style={{ animationDelay: "0.1s" }}>
        Instant Airtime, Data, Electricity & more — zero hidden fees
      </p>

      {/* Two CTA Buttons */}
      <div className="flex gap-3 mb-6 max-w-xs mx-auto animate-slide-up" style={{ animationDelay: "0.2s" }}>
        <Link to="/signup" className="flex-1">
          <Button className="w-full gradient-primary text-primary-foreground font-bold h-12 rounded-2xl text-sm hover-lift">
            Get Started <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
        <Link to="/login" className="flex-1">
          <Button variant="outline" className="w-full h-12 rounded-2xl text-sm font-semibold border-2 border-primary/20 text-primary hover:bg-primary/5 hover-lift">
            Login
          </Button>
        </Link>
      </div>

      {/* 2-Column Service Grid */}
      <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto lg:grid-cols-3 lg:max-w-2xl">
        {services.map((service, i) => (
          <Link key={i} to={service.path}>
            <div className="fintech-card p-4 tap-target hover:scale-[1.03] transition-all animate-scale-in" style={{ animationDelay: `${i * 0.08}s` }}>
              <div className={`w-10 h-10 rounded-xl ${service.color} flex items-center justify-center mb-2 mx-auto`}>
                <service.icon className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-foreground text-center">{service.label}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  </section>
);

/* ---------------- Features Row ---------------- */
const features = [
  { icon: Shield, title: "Secure", desc: "Bank-grade security" },
  { icon: Clock, title: "Instant", desc: "Under 5 seconds" },
  { icon: Zap, title: "Reliable", desc: "24/7 availability" },
];

const FeaturesSection = () => (
  <section className="py-6 px-4 bg-secondary/50">
    <div className="max-w-[420px] lg:max-w-4xl mx-auto">
      <div className="grid grid-cols-3 gap-2">
        {features.map((f, i) => (
          <div key={i} className="fintech-card p-3 text-center">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2 mx-auto">
              <f.icon className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-foreground mb-0.5">{f.title}</h3>
            <p className="text-[10px] text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ---------------- About Section ---------------- */
const AboutSection = () => (
  <section id="about" className="py-8 px-4">
    <div className="max-w-[420px] lg:max-w-3xl mx-auto">
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 text-accent-foreground text-[11px] font-bold mb-3">
        <Star className="w-3 h-3" /> The Uteelpay Story
      </div>
      <h2 className="text-xl lg:text-3xl font-extrabold mb-3 text-foreground">
        We power <span className="text-gradient">possibilities.</span>
      </h2>
      <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
        <p>What if paying your everyday bills felt as effortless as sending a text? That's why we built <strong className="text-foreground">Uteelpay</strong>.</p>
        <p>From ensuring a student gets their WAEC pin at 2 AM, to keeping households powered across Nigeria — we deliver speed, security, and zero hidden charges.</p>
      </div>
    </div>
  </section>
);

/* ---------------- How It Works ---------------- */
const steps = [
  { num: "1", title: "Sign Up", desc: "Create your account in seconds" },
  { num: "2", title: "Fund Wallet", desc: "Add money via Bank or Card" },
  { num: "3", title: "Pay Bills", desc: "Select a service and pay instantly" },
];

const HowItWorks = () => (
  <section id="how-it-works" className="py-8 px-4 bg-secondary/50">
    <div className="max-w-[420px] lg:max-w-4xl mx-auto">
      <h2 className="text-lg font-extrabold text-center mb-5 text-foreground">How It Works</h2>
      <div className="grid grid-cols-3 gap-2 lg:gap-6">
        {steps.map((s, i) => (
          <div key={i} className="fintech-card p-3 lg:p-6 text-center">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-2 text-primary-foreground text-xs font-bold">
              {s.num}
            </div>
            <h3 className="text-xs font-bold text-foreground mb-1">{s.title}</h3>
            <p className="text-[10px] text-muted-foreground">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ---------------- Referral Banner ---------------- */
const ReferralBanner = () => (
  <section className="py-6 px-4">
    <div className="max-w-[420px] lg:max-w-3xl mx-auto">
      <div className="fintech-card p-5 bg-accent/5 border-accent/20 text-center">
        <Gift className="w-8 h-8 text-accent mx-auto mb-2" />
        <h3 className="text-base font-extrabold text-foreground mb-1">Refer & Earn</h3>
        <p className="text-xs text-muted-foreground mb-3">Invite friends and earn amazing bonuses as they transact!</p>
        <Link to="/signup">
          <Button className="btn-gold h-11 rounded-xl text-sm font-bold px-6">Start Earning <ArrowRight className="w-3.5 h-3.5 ml-1" /></Button>
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
  <section id="pricing" className="py-8 px-4 bg-secondary/50">
    <div className="max-w-[420px] lg:max-w-4xl mx-auto">
      <h2 className="text-lg font-extrabold text-center mb-1 text-foreground">Affordable Pricing</h2>
      <p className="text-xs text-muted-foreground text-center mb-5">No hidden charges. Best rates guaranteed.</p>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {pricingData.map((s, i) => (
          <div key={i} className="fintech-card p-3">
            <h3 className="text-xs font-bold text-foreground mb-0.5">{s.name}</h3>
            <p className="text-base font-extrabold text-gradient mb-0.5">{s.price}</p>
            <p className="text-[10px] text-muted-foreground">{s.desc}</p>
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
  <section id="faqs" className="py-8 px-4">
    <div className="max-w-[420px] lg:max-w-3xl mx-auto">
      <h2 className="text-lg font-extrabold text-center mb-5 text-foreground">FAQs</h2>
      <div className="space-y-3">
        {faqs.map((f, i) => (
          <div key={i} className="fintech-card p-4">
            <h3 className="text-xs font-bold text-foreground mb-1 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-primary shrink-0" /> {f.q}
            </h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed pl-6">{f.a}</p>
          </div>
        ))}
      </div>
      <div className="text-center mt-4">
        <Link to="/faqs">
          <Button variant="ghost" size="sm" className="text-xs text-primary font-bold gap-1">
            View Full Help Center <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>
    </div>
  </section>
);

/* ---------------- Trust Bar ---------------- */
const TrustBar = () => (
  <section className="py-6 px-4 border-t border-border/30">
    <div className="max-w-[420px] lg:max-w-4xl mx-auto">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { icon: Shield, text: "Secure Payments", color: "text-primary" },
          { icon: Zap, text: "Instant Delivery", color: "text-accent" },
          { icon: Users, text: "10,000+ Users", color: "text-primary" },
          { icon: Phone, text: "24/7 Support", color: "text-accent" },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-xs font-semibold text-muted-foreground justify-center">
            <item.icon className={`w-4 h-4 ${item.color}`} /> {item.text}
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ---------------- Footer ---------------- */
const Footer = () => (
  <footer className="py-6 px-4 border-t border-border/30 bg-card">
    <div className="max-w-[420px] lg:max-w-4xl mx-auto text-center">
      <p className="font-extrabold text-gradient text-lg mb-3">Uteelpay</p>
      <div className="flex flex-wrap justify-center gap-4 text-[11px] font-semibold text-muted-foreground mb-4">
        <a href="#services" className="hover:text-primary">Services</a>
        <a href="#pricing" className="hover:text-primary">Pricing</a>
        <Link to="/faqs" className="hover:text-primary">FAQs</Link>
        <Link to="/signup" className="hover:text-primary">Create Account</Link>
      </div>
      <p className="text-[10px] text-muted-foreground">© 2026 Uteelpay. All rights reserved.</p>
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
    <FeaturesSection />
    <AboutSection />
    <HowItWorks />
    <ReferralBanner />
    <PricingSection />
    <FAQSection />
    <TrustBar />
    <Footer />
    <WhatsAppButton />
  </div>
);

export default Landing;
