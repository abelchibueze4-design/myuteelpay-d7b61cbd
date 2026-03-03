import { Link } from "react-router-dom";
import {
  Zap, Shield, Clock, Star, Smartphone, Tv, GraduationCap,
  MessageSquare, CreditCard, Users, ArrowRight, Phone, Gift, HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";

/* ---------------- Navbar ---------------- */
const Navbar = () => (
  <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
    <div className="container mx-auto flex items-center justify-between h-16 px-4">
      <Link to="/" className="text-xl font-bold text-gradient">Uteelpay</Link>
      <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
        <a href="#about" className="hover:text-foreground transition-colors">About Us</a>
        <a href="#services" className="hover:text-foreground transition-colors">Services</a>
        <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
        <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
        <a href="#faqs" className="hover:text-foreground transition-colors">FAQs</a>
      </div>
      <div className="flex items-center gap-3">
        <Link to="/login"><Button variant="ghost" size="sm">Login</Button></Link>
        <Link to="/signup"><Button variant="hero" size="sm">Register</Button></Link>
      </div>
    </div>
  </nav>
);

/* ---------------- Hero Section ---------------- */
const quickActions = [
  { icon: Smartphone, label: "Airtime", path: "/services/airtime", color: "bg-primary/10 text-primary" },
  { icon: Smartphone, label: "Data", path: "/services/data", color: "bg-accent/20 text-accent-foreground" },
  { icon: Tv, label: "Cable TV", path: "/services/cable", color: "bg-accent/20 text-accent-foreground" },
  { icon: Zap, label: "Electricity", path: "/services/electricity", color: "bg-primary-glow/10 text-primary" },
  { icon: MessageSquare, label: "Bulk SMS", path: "/services/sms", color: "bg-accent/20 text-accent-foreground" },
  { icon: GraduationCap, label: "Edu Pins", path: "/services/edu", color: "bg-primary/10 text-primary" },
  { icon: Gift, label: "Refer & Earn", path: "/referral", color: "bg-accent/20 text-accent-foreground" },
];

const HeroSection = () => (
  <section className="relative pt-28 pb-20 overflow-hidden">
    <div className="absolute inset-0 gradient-hero opacity-5" />
    <div className="container mx-auto px-4 relative">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div className="animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-light text-primary text-sm font-medium mb-6">
            <Star className="w-4 h-4 text-accent" />
            <span>Nigeria's Trusted Utility Platform</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
            Fast, Reliable Utility Payments for your <span className="text-gradient">Lifestyle</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-lg">
            Instant Airtime, Data, Electricity, and Education Pins with zero hidden fees.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/signup"><Button variant="hero" size="lg">Get Started <ArrowRight className="w-4 h-4 ml-1" /></Button></Link>
            <a href="#pricing"><Button variant="outline" size="lg" className="rounded-xl border-accent text-accent hover:bg-accent/10">View Rates</Button></a>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-7 gap-3 mt-6">
            {quickActions.map((a) => (
              <Link key={a.path} to={a.path} className="flex flex-col items-center text-xs">
                <div className={`w-10 h-10 rounded-lg ${a.color} flex items-center justify-center mb-1`}>
                  <a.icon className="w-5 h-5" />
                </div>
                <span>{a.label}</span>
              </Link>
            ))}
          </div>
        </div>
        <div className="hidden md:flex justify-center">
          <div className="w-72 h-[500px] rounded-[2.5rem] gradient-hero shadow-primary p-6 flex flex-col justify-between text-primary-foreground">
            <div>
              <p className="text-sm opacity-70">Wallet Balance</p>
              <p className="text-3xl font-extrabold mt-1">₦125,000</p>
            </div>
            <div className="space-y-3">
              {["MTN Airtime ₦2,000", "DSTV Premium ₦24,500", "IKEDC Power ₦5,000"].map((t, i) => (
                <div key={i} className="bg-primary-foreground/10 rounded-xl px-4 py-3 text-sm backdrop-blur-sm">
                  {t}
                </div>
              ))}
            </div>
            <div className="text-center text-xs opacity-60">Uteelpay • Secure</div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

/* ---------------- About Us ---------------- */
const AboutUs = () => (
  <section id="about" className="py-24 relative overflow-hidden bg-background">
    <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl"></div>
    </div>
    <div className="container mx-auto px-4 relative z-10">
      <div className="max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-semibold mb-8 shadow-sm">
          <Star className="w-4 h-4" />
          <span>The Uteelpay Story</span>
        </div>
        <h2 className="text-4xl md:text-5xl lg:text-5xl font-extrabold leading-tight mb-8">
          We don't just process payments.<br />We power <span className="text-gradient">possibilities.</span>
        </h2>
        <div className="space-y-6 text-lg text-muted-foreground leading-relaxed">
          <p>
            In a world that never stops moving, dealing with slow, complicated, or hidden-fee utility platforms shouldn't be your reality. That's exactly why we built <strong>Uteelpay</strong>.
          </p>
          <p>
            We started with a radically simple idea: what if paying your everyday bills felt as effortless as sending a text message? What if you never had to worry about service down-times when you needed electricity the most, or running out of data right before an important meeting?
          </p>
          <p>
            Today, Uteelpay is the silent powerhouse behind thousands of Nigerians' daily routines. From ensuring a student gets their WAEC pin at 2 AM, to keeping households illuminated across the nation, we deliver absolute speed, rock-solid security, and zero hidden charges.
          </p>
          <div className="pt-6 mt-6 border-t border-border/50">
            <p className="font-semibold text-foreground text-xl">
              Because your time is the most valuable currency, and we refuse to let you waste a single second of it.
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
);

/* ---------------- Services ---------------- */
const services = [
  { icon: Smartphone, name: "Airtime", desc: "MTN, Airtel, Glo, 9mobile" },
  { icon: Smartphone, name: "Data", desc: "Affordable data bundles for all networks" },
  { icon: Zap, name: "Electricity Bills", desc: "Prepaid & Postpaid for all DISCOs" },
  { icon: Tv, name: "Cable TV", desc: "DSTV, GOtv, StarTimes" },
  { icon: GraduationCap, name: "Edu Pins", desc: "WAEC, NECO, JAMB" },
  { icon: MessageSquare, name: "Bulk SMS", desc: "Business & Personal" },
  { icon: CreditCard, name: "Virtual Cards", desc: "Coming Soon", coming: true },
];

const ServicesSection = () => (
  <section id="services" className="py-20 bg-secondary">
    <div className="container mx-auto px-4">
      <h2 className="text-3xl font-bold text-center mb-4">Our Services</h2>
      <p className="text-center text-muted-foreground mb-12 max-w-md mx-auto">
        Everything you need to stay connected and powered up
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {services.map((s, i) => (
          <div
            key={i}
            className={`bg-card rounded-2xl p-6 shadow-card hover:shadow-primary/10 transition-shadow relative ${s.coming ? "opacity-60" : ""}`}
          >
            {s.coming && (
              <span className="absolute top-4 right-4 text-xs font-bold text-accent bg-accent/10 px-2 py-1 rounded-full">
                Soon
              </span>
            )}
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
              <s.icon className="w-6 h-6 text-primary-foreground" />
            </div>
            <h3 className="font-bold text-lg mb-1">{s.name}</h3>
            <p className="text-sm text-muted-foreground">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ---------------- How It Works ---------------- */
const steps = [
  { icon: Shield, num: "1", title: "Sign Up", desc: "Create your account in seconds with your email." },
  { icon: Zap, num: "2", title: "Fund Wallet", desc: "Add money via Bank Transfer or Card payment." },
  { icon: Clock, num: "3", title: "Pay Bills", desc: "Select a service and pay in under 5 seconds." },
];

const HowItWorks = () => (
  <section id="how-it-works" className="py-20">
    <div className="container mx-auto px-4">
      <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
      <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
        {steps.map((s, i) => (
          <div key={i} className="text-center bg-card rounded-2xl p-8 shadow-card">
            <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-4">
              <s.icon className="w-7 h-7 text-primary-foreground" />
            </div>
            <div className="text-sm font-semibold text-accent mb-2">Step {s.num}</div>
            <h3 className="text-lg font-bold mb-2">{s.title}</h3>
            <p className="text-sm text-muted-foreground">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ---------------- Referral ---------------- */
const ReferralBanner = () => (
  <section className="py-16">
    <div className="container mx-auto px-4">
      <div className="rounded-2xl border-2 border-accent/40 bg-accent/5 p-8 md:p-12 text-center shadow-gold">
        <Gift className="w-12 h-12 text-accent mx-auto mb-4" />
        <h2 className="text-2xl md:text-3xl font-bold mb-3">Refer a Friend & Earn</h2>
        <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
          Refer a friend and earn amazing bonuses as they transact. Share your unique link and watch your earnings grow!
        </p>
        <Link to="/signup"><Button variant="gold" size="lg">Start Earning Now <ArrowRight className="w-4 h-4 ml-1" /></Button></Link>
      </div>
    </div>
  </section>
);

/* ---------------- Pricing ---------------- */
const pricingData = [
  { name: "Airtime", price: "From ₦50", desc: "MTN, Glo, Airtel, 9mobile — up to 4% discount" },
  { name: "Data Bundles", price: "From ₦200", desc: "All networks, 30-day plans with best rates" },
  { name: "Cable TV", price: "From ₦1,300", desc: "DSTV, GOTV, StarTimes subscriptions" },
  { name: "Electricity", price: "From ₦500", desc: "Prepaid & Postpaid for all DISCOs" },
  { name: "Bulk SMS", price: "₦2.5/SMS", desc: "Send to thousands instantly" },
  { name: "Edu Pins", price: "From ₦1,800", desc: "WAEC & NECO result checker pins" },
];

const PricingSection = () => (
  <section id="pricing" className="py-20 bg-secondary">
    <div className="container mx-auto px-4">
      <h2 className="text-3xl font-bold text-center mb-4">Affordable Pricing</h2>
      <p className="text-center text-muted-foreground mb-12 max-w-md mx-auto">Enjoy the best rates on all services. No hidden charges.</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {pricingData.map((s, i) => (
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

/* ---------------- FAQs Section ---------------- */
const landingFaqs = [
  { q: "How fast are top-ups?", a: "Most transactions are processed instantly. You'll receive your value in under 5 seconds." },
  { q: "Is Uteelpay secure?", a: "Yes. We use bank-grade encryption and secure Paystack gateway for all fundings." },
  { q: "What if I have an issue?", a: "Our support team is available 24/7 via WhatsApp and email to resolve any complaints." },
];

const FAQSection = () => (
  <section id="faqs" className="py-20 bg-background relative overflow-hidden">
    <div className="absolute top-1/2 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -ml-32 -mt-32 invisible md:visible" />
    <div className="container mx-auto px-4 relative z-10">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
        <p className="text-muted-foreground max-w-md mx-auto italic">Quick answers to common questions about our platform.</p>
      </div>
      <div className="max-w-3xl mx-auto space-y-4">
        {landingFaqs.map((f, i) => (
          <div key={i} className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="font-black text-foreground mb-2 flex items-center gap-3">
              <HelpCircle className="w-5 h-5 text-primary shrink-0" /> {f.q}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed pl-8">{f.a}</p>
          </div>
        ))}
      </div>
      <div className="text-center mt-12">
        <Link to="/faqs">
          <Button variant="ghost" className="rounded-full text-primary font-bold gap-2">
            View Full Help Center <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  </section>
);

/* ---------------- Trust Bar ---------------- */
const TrustBar = () => (
  <section className="py-12 border-t">
    <div className="container mx-auto px-4 text-center">
      <p className="text-sm text-muted-foreground mb-6">Trusted by thousands across Nigeria</p>
      <div className="flex flex-wrap justify-center items-center gap-8 text-muted-foreground">
        <div className="flex items-center gap-2 font-semibold"><Shield className="w-5 h-5 text-primary" /> Secure Payments</div>
        <div className="flex items-center gap-2 font-semibold"><Zap className="w-5 h-5 text-accent" /> Instant Delivery</div>
        <div className="flex items-center gap-2 font-semibold"><Users className="w-5 h-5 text-primary" /> 10,000+ Users</div>
        <div className="flex items-center gap-2 font-semibold"><Phone className="w-5 h-5 text-accent" /> 24/7 Support</div>
      </div>
    </div>
  </section>
);

/* ---------------- Footer ---------------- */
const Footer = () => (
  <footer className="border-t py-12 bg-card relative overflow-hidden">
    <div className="container mx-auto px-4 text-center">
      <p className="font-black text-gradient text-2xl mb-6 tracking-tighter">Uteelpay</p>

      <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm font-bold text-muted-foreground mb-8">
        <a href="#" className="hover:text-primary transition-colors">Home</a>
        <a href="#services" className="hover:text-primary transition-colors">Services</a>
        <a href="#pricing" className="hover:text-primary transition-colors">Pricing</a>
        <Link to="/faqs" className="hover:text-primary transition-colors">FAQs & Support</Link>
        <Link to="/signup" className="hover:text-primary transition-colors">Create Account</Link>
      </div>

      <div className="border-t border-border/30 pt-8">
        <p className="text-xs text-muted-foreground">© 2026 Uteelpay. Empowering Nigeria's digital lifestyle.</p>
      </div>
    </div>
  </footer>
);

/* ---------------- WhatsApp Button ---------------- */
const WhatsAppButton = () => (
  <a
    href="https://wa.me/2348000000000"
    target="_blank"
    rel="noopener noreferrer"
    className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[hsl(142,70%,45%)] flex items-center justify-center shadow-lg hover:bg-[hsl(142,70%,40%)] transition-colors"
    aria-label="WhatsApp Support"
  >
    <MessageSquare className="w-6 h-6 text-primary-foreground" />
  </a>
);

/* ---------------- Landing Page ---------------- */
const Landing = () => (
  <div className="min-h-screen">
    <Navbar />
    <HeroSection />
    <AboutUs />
    <ServicesSection />
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