import { Link } from "react-router-dom";
import { Zap, Shield, Clock, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

const Navbar = () => (
  <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
    <div className="container mx-auto flex items-center justify-between h-16 px-4">
      <Link to="/" className="text-xl font-bold text-gradient">PayNaija</Link>
      <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
        <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
        <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
        <a href="#services" className="hover:text-foreground transition-colors">Services</a>
      </div>
      <div className="flex items-center gap-3">
        <Link to="/login"><Button variant="ghost" size="sm">Login</Button></Link>
        <Link to="/signup"><Button size="sm">Get Started</Button></Link>
      </div>
    </div>
  </nav>
);

const HeroSection = () => (
  <section className="relative pt-32 pb-20 overflow-hidden">
    <div className="absolute inset-0 gradient-hero opacity-5" />
    <div className="container mx-auto px-4 relative">
      <div className="max-w-2xl mx-auto text-center animate-fade-in">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-light text-primary text-sm font-medium mb-6">
          <Star className="w-4 h-4 text-accent" />
          <span>Nigeria's #1 Utility Payment Platform</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
          Pay Bills <span className="text-gradient">Instantly</span> From Anywhere
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto">
          Airtime, data, electricity, cable TV, and more — all in one app. Fast, secure, and affordable.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/signup"><Button variant="hero">Start For Free</Button></Link>
          <a href="#how-it-works"><Button variant="outline" size="lg" className="rounded-xl">Learn More</Button></a>
        </div>
      </div>
    </div>
  </section>
);

const steps = [
  { icon: Shield, title: "Create Account", desc: "Sign up in seconds with your email or phone number." },
  { icon: Zap, title: "Fund Wallet", desc: "Add money to your wallet via bank transfer or card." },
  { icon: Clock, title: "Pay Instantly", desc: "Select a service and pay in under 5 seconds." },
];

const HowItWorks = () => (
  <section id="how-it-works" className="py-20 bg-secondary">
    <div className="container mx-auto px-4">
      <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
      <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
        {steps.map((s, i) => (
          <div key={i} className="text-center bg-background rounded-2xl p-8 shadow-card" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-4">
              <s.icon className="w-7 h-7 text-primary-foreground" />
            </div>
            <div className="text-sm font-semibold text-accent mb-2">Step {i + 1}</div>
            <h3 className="text-lg font-bold mb-2">{s.title}</h3>
            <p className="text-sm text-muted-foreground">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const services = [
  { name: "Airtime & Data", price: "From ₦50", desc: "MTN, Glo, Airtel, 9mobile" },
  { name: "Cable TV", price: "From ₦1,850", desc: "DSTV, GOTV, StarTimes" },
  { name: "Electricity", price: "From ₦500", desc: "Prepaid & Postpaid meters" },
  { name: "Bulk SMS", price: "₦2.5/SMS", desc: "Send to thousands instantly" },
  { name: "Edu Pins", price: "From ₦3,500", desc: "WAEC & NECO result pins" },
];

const PricingSection = () => (
  <section id="pricing" className="py-20">
    <div className="container mx-auto px-4">
      <h2 className="text-3xl font-bold text-center mb-4">Affordable Pricing</h2>
      <p className="text-center text-muted-foreground mb-12 max-w-md mx-auto">Enjoy the best rates on all services. No hidden charges.</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {services.map((s, i) => (
          <div key={i} className="rounded-2xl border bg-card p-6 hover:shadow-card transition-shadow">
            <h3 className="font-bold text-lg mb-1">{s.name}</h3>
            <p className="text-2xl font-extrabold text-gradient mb-2">{s.price}</p>
            <p className="text-sm text-muted-foreground mb-4">{s.desc}</p>
            <Link to="/signup"><Button variant="outline" size="sm" className="w-full">Get Started</Button></Link>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="border-t py-10">
    <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
      <p className="font-bold text-gradient text-lg mb-2">PayNaija</p>
      <p>© 2026 PayNaija. All rights reserved.</p>
    </div>
  </footer>
);

const Landing = () => (
  <div className="min-h-screen">
    <Navbar />
    <HeroSection />
    <HowItWorks />
    <PricingSection />
    <Footer />
  </div>
);

export default Landing;
