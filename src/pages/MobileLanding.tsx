import { Link } from "react-router-dom";
import { Zap, Smartphone, Tv, Gift, ArrowRight, MessageSquare, Star, Shield, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

/* ---------------- Mobile Navbar ---------------- */
const MobileNavbar = () => (
  <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-b border-white/80">
    <div className="mobile-container flex items-center justify-between h-14">
      <Link to="/" className="text-xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
        Uteelpay
      </Link>
      <div className="flex items-center gap-2">
        <Link to="/login">
          <Button variant="ghost" size="sm" className="text-sm font-medium">
            Login
          </Button>
        </Link>
        <Link to="/signup">
          <Button size="sm" className="bg-gradient-to-r from-purple-600 to-purple-700 text-white text-sm font-bold rounded-xl">
            Register
          </Button>
        </Link>
      </div>
    </div>
  </nav>
);

/* ---------------- Mobile Hero Section ---------------- */
const services = [
  { icon: Smartphone, label: "Airtime", color: "bg-purple-100 text-purple-600" },
  { icon: Smartphone, label: "Data", color: "bg-blue-100 text-blue-600" },
  { icon: Tv, label: "Cable TV", color: "bg-orange-100 text-orange-600" },
  { icon: Zap, label: "Electricity", color: "bg-yellow-100 text-yellow-600" },
];

const MobileHero = () => (
  <section className="pt-20 pb-8 px-4 animate-fade-in">
    <div className="mobile-container text-center">
      {/* Compact Hero Headline */}
      <div className="mb-6 animate-slide-up">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold mb-4 animate-pulse-slow">
          <Star className="w-3 h-3" />
          <span>Nigeria's Trusted Platform</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3 leading-tight">
          Fast Utility Payments
        </h1>
        <p className="text-gray-600 text-sm leading-relaxed">
          Instant Airtime, Data, Electricity & more with zero hidden fees
        </p>
      </div>

      {/* Two CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8 animate-slide-up" style={{animationDelay: '0.2s'}}>
        <Link to="/signup" className="flex-1">
          <Button className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold h-14 rounded-xl text-base hover-lift hover-glow">
            Get Started <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
        <Link to="/services" className="flex-1">
          <Button variant="outline" className="w-full h-14 rounded-xl text-base font-semibold border-2 border-purple-200 text-purple-700 hover:bg-purple-50 hover-lift">
            View Services
          </Button>
        </Link>
      </div>

      {/* Simple 2-column Service Grid */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        {services.map((service, index) => (
          <Link key={index} to={`/services/${service.label.toLowerCase().replace(' ', '')}`}>
            <div className="fintech-card p-4 tap-target hover:scale-105 transition-all hover-lift animate-scale-in" style={{animationDelay: `${index * 0.1}s`}}>
              <div className={`w-10 h-10 rounded-xl ${service.color} flex items-center justify-center mb-2 mx-auto`}>
                <service.icon className="w-5 h-5" />
              </div>
              <p className="text-sm font-semibold text-gray-800 text-center">{service.label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Wallet Preview Card */}
      <div className="fintech-card p-6 bg-gradient-to-br from-purple-50 to-purple-100 animate-bounce-in" style={{animationDelay: '0.5s'}}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Wallet Balance</p>
            <p className="text-2xl font-bold text-purple-700">₦125,000</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-white/80 flex items-center justify-center animate-float">
            <Gift className="w-6 h-6 text-purple-600" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-600">
            <span>MTN Airtime</span>
            <span className="font-semibold">₦2,000</span>
          </div>
          <div className="flex justify-between text-xs text-gray-600">
            <span>DSTV Premium</span>
            <span className="font-semibold">₦24,500</span>
          </div>
        </div>
      </div>
    </div>
  </section>
);

/* ---------------- Mobile Features Section ---------------- */
const features = [
  { icon: Shield, title: "Secure", desc: "Bank-grade security" },
  { icon: Clock, title: "Instant", desc: "Under 5 seconds" },
  { icon: Zap, title: "Reliable", desc: "24/7 service" },
];

const MobileFeatures = () => (
  <section className="py-8 px-4 bg-gray-50">
    <div className="mobile-container">
      <h2 className="text-xl font-bold text-center mb-6">Why Choose Uteelpay?</h2>
      <div className="grid grid-cols-3 gap-3">
        {features.map((feature, index) => (
          <div key={index} className="fintech-card p-4 text-center">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-2 mx-auto">
              <feature.icon className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-gray-800 mb-1">{feature.title}</h3>
            <p className="text-xs text-gray-600">{feature.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* ---------------- Mobile CTA Section ---------------- */
const MobileCTA = () => (
  <section className="py-8 px-4">
    <div className="mobile-container text-center">
      <div className="fintech-card p-6 bg-gradient-to-br from-purple-600 to-purple-700 text-white">
        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mb-4 mx-auto">
          <MessageSquare className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-lg font-bold mb-2">Need Help?</h3>
        <p className="text-purple-100 text-sm mb-4">Our support team is available 24/7</p>
        <div className="flex gap-3">
          <a href="https://wa.me/2349022334478" className="flex-1">
            <Button className="w-full bg-white text-purple-700 font-bold h-12 rounded-xl">
              WhatsApp
            </Button>
          </a>
          <a href="mailto:support@uteelpay.com" className="flex-1">
            <Button variant="outline" className="w-full border-white/30 text-white h-12 rounded-xl hover:bg-white/10">
              Email
            </Button>
          </a>
        </div>
      </div>
    </div>
  </section>
);

/* ---------------- Mobile Footer ---------------- */
const MobileFooter = () => (
  <footer className="py-6 px-4 border-t border-gray-100">
    <div className="mobile-container text-center">
      <p className="text-lg font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent mb-2">
        Uteelpay
      </p>
      <p className="text-xs text-gray-500 mb-4">Fast, reliable utility payments</p>
      <div className="flex justify-center gap-4 text-xs text-gray-600">
        <Link to="/about" className="hover:text-purple-600">About</Link>
        <Link to="/services" className="hover:text-purple-600">Services</Link>
        <Link to="/faqs" className="hover:text-purple-600">Help</Link>
      </div>
      <p className="text-xs text-gray-400 mt-4">© 2026 Uteelpay. All rights reserved.</p>
    </div>
  </footer>
);

/* ---------------- Sticky Bottom Navigation ---------------- */
const BottomNav = () => {
  const navItems = [
    { icon: Smartphone, label: "Home", path: "/", active: true },
    { icon: Zap, label: "Services", path: "/services" },
    { icon: Gift, label: "Wallet", path: "/dashboard" },
    { icon: MessageSquare, label: "Referrals", path: "/referral" },
  ];

  return (
    <nav className="bottom-nav">
      <div className="mobile-container flex items-center justify-around h-16">
        {navItems.map((item, index) => (
          <Link key={index} to={item.path} className="flex flex-col items-center tap-target">
            <item.icon className={`w-5 h-5 mb-1 ${item.active ? 'text-purple-600' : 'text-gray-400'}`} />
            <span className={`text-xs font-medium ${item.active ? 'text-purple-600' : 'text-gray-400'}`}>
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
};

/* ---------------- Mobile Landing Page ---------------- */
const MobileLanding = () => (
  <div className="min-h-screen bg-white">
    <MobileNavbar />
    <main className="pb-20">
      <MobileHero />
      <MobileFeatures />
      <MobileCTA />
      <MobileFooter />
    </main>
    <BottomNav />
  </div>
);

export default MobileLanding;