import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Smartphone, Phone, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

/* ---------------- Mobile Service Header ---------------- */
const ServiceHeader = ({ title = "Airtime" }) => {
  const navigate = useNavigate();
  
  return (
    <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg border-b border-gray-100">
      <div className="mobile-container py-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="tap-target"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-purple-600" />
            <h1 className="text-lg font-bold text-gray-900">{title}</h1>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------------- Service Info Card ---------------- */
const ServiceInfo = ({ title, description, benefits = [] }) => (
  <div className="px-4 mb-6">
    <Card className="fintech-card p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
          <Info className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-purple-700 mb-1">{title}</h3>
          <p className="text-xs text-purple-600 mb-2">{description}</p>
          {benefits.length > 0 && (
            <ul className="text-xs text-purple-600 space-y-1">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-1">
                  <div className="w-1 h-1 rounded-full bg-purple-400"></div>
                  {benefit}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Card>
  </div>
);

/* ---------------- Large Rounded Input Fields ---------------- */
const ServiceInput = ({ 
  label, 
  placeholder, 
  type = "text", 
  value, 
  onChange, 
  icon: Icon,
  helperText,
  error
}) => (
  <div className="px-4 mb-4">
    <Label className="text-sm font-semibold text-gray-700 mb-2 block">{label}</Label>
    <div className="relative">
      {Icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
          <Icon className="w-5 h-5" />
        </div>
      )}
      <Input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`mobile-input pl-12 ${error ? 'border-red-300' : 'border-gray-200'} focus:border-purple-500 focus:ring-purple-500`}
      />
    </div>
    {helperText && (
      <p className="text-xs text-gray-500 mt-1">{helperText}</p>
    )}
    {error && (
      <p className="text-xs text-red-500 mt-1">{error}</p>
    )}
  </div>
);

/* ---------------- Amount Selection Grid ---------------- */
const AmountSelector = ({ amounts = [100, 200, 500, 1000, 2000, 5000], selectedAmount, onSelect }) => (
  <div className="px-4 mb-6">
    <Label className="text-sm font-semibold text-gray-700 mb-3 block">Select Amount</Label>
    <div className="grid grid-cols-3 gap-3">
      {amounts.map((amount) => (
        <Button
          key={amount}
          variant={selectedAmount === amount ? "default" : "outline"}
          onClick={() => onSelect(amount)}
          className={`h-14 rounded-xl text-sm font-bold ${
            selectedAmount === amount 
              ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white' 
              : 'border-gray-200 text-gray-700 hover:border-purple-300'
          }`}
        >
          ₦{amount.toLocaleString()}
        </Button>
      ))}
    </div>
  </div>
);

/* ---------------- Network Selection ---------------- */
const NetworkSelector = ({ selectedNetwork, onSelect }) => {
  const networks = [
    { name: "MTN", color: "bg-yellow-500" },
    { name: "GLO", color: "bg-green-500" },
    { name: "Airtel", color: "bg-red-500" },
    { name: "9mobile", color: "bg-purple-500" },
  ];

  return (
    <div className="px-4 mb-6">
      <Label className="text-sm font-semibold text-gray-700 mb-3 block">Select Network</Label>
      <div className="grid grid-cols-2 gap-3">
        {networks.map((network) => (
          <Button
            key={network.name}
            variant={selectedNetwork === network.name ? "default" : "outline"}
            onClick={() => onSelect(network.name)}
            className={`h-14 rounded-xl text-sm font-bold flex items-center gap-2 ${
              selectedNetwork === network.name 
                ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white' 
                : 'border-gray-200 text-gray-700 hover:border-purple-300'
            }`}
          >
            <div className={`w-3 h-3 rounded-full ${network.color}`}></div>
            {network.name}
          </Button>
        ))}
      </div>
    </div>
  );
};

/* ---------------- Service Summary ---------------- */
const ServiceSummary = ({ phoneNumber, amount, network, onConfirm }) => (
  <div className="px-4 mb-6">
    <Card className="fintech-card p-4 bg-gray-50">
      <h3 className="text-sm font-bold text-gray-700 mb-3">Transaction Summary</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Phone Number:</span>
          <span className="font-semibold">{phoneNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Network:</span>
          <span className="font-semibold">{network}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Amount:</span>
          <span className="font-semibold">₦{amount.toLocaleString()}</span>
        </div>
        <div className="border-t pt-2 flex justify-between">
          <span className="text-gray-600">Total:</span>
          <span className="font-bold text-purple-700">₦{amount.toLocaleString()}</span>
        </div>
      </div>
    </Card>
  </div>
);

/* ---------------- Bold Gold Proceed Button ---------------- */
const ProceedButton = ({ onClick, disabled, loading }) => (
  <div className="px-4 mb-6">
    <Button
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full btn-gold h-14 rounded-xl text-base font-bold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          Processing...
        </div>
      ) : (
        "Proceed to Payment"
      )}
    </Button>
  </div>
);

/* ---------------- Sticky Bottom Navigation ---------------- */
const BottomNav = ({ activeTab = "services" }) => {
  const navItems = [
    { icon: Smartphone, label: "Home", path: "/dashboard", key: "home" },
    { icon: Zap, label: "Services", path: "/services", key: "services" },
    { icon: Wallet, label: "Wallet", path: "/dashboard?tab=wallet", key: "wallet" },
    { icon: Gift, label: "Referrals", path: "/referral", key: "referrals" },
  ];

  return (
    <nav className="bottom-nav">
      <div className="mobile-container flex items-center justify-around h-16">
        {navItems.map((item) => (
          <Link 
            key={item.key} 
            to={item.path} 
            className={`flex flex-col items-center tap-target py-2 px-3 rounded-xl transition-colors ${
              activeTab === item.key ? 'text-purple-600' : 'text-gray-400'
            }`}
          >
            <item.icon className={`w-5 h-5 mb-1 ${activeTab === item.key ? 'text-purple-600' : 'text-gray-400'}`} />
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};

/* ---------------- Mobile Service Page ---------------- */
const MobileServicePage = ({ 
  serviceType = "airtime",
  title = "Buy Airtime",
  description = "Instant airtime recharge for all networks",
  benefits = ["Instant delivery", "24/7 availability", "Best rates"]
}) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [amount, setAmount] = useState(500);
  const [network, setNetwork] = useState("MTN");
  const [loading, setLoading] = useState(false);

  const handleProceed = () => {
    if (!phoneNumber || !amount || !network) {
      return;
    }
    setLoading(true);
    // Simulate payment processing
    setTimeout(() => {
      setLoading(false);
      alert(`Processing ₦${amount.toLocaleString()} ${title.toLowerCase()} for ${phoneNumber}`);
    }, 2000);
  };

  const isFormValid = phoneNumber && amount && network;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <ServiceHeader title={title} />
      
      <main className="pt-4">
        <ServiceInfo 
          title={title} 
          description={description} 
          benefits={benefits} 
        />
        
        <NetworkSelector 
          selectedNetwork={network} 
          onSelect={setNetwork} 
        />
        
        <ServiceInput
          label="Phone Number"
          placeholder="Enter phone number"
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          icon={Phone}
          helperText="Enter 11-digit phone number"
        />
        
        <AmountSelector
          amounts={[100, 200, 500, 1000, 2000, 5000]}
          selectedAmount={amount}
          onSelect={setAmount}
        />
        
        {phoneNumber && amount && network && (
          <ServiceSummary
            phoneNumber={phoneNumber}
            amount={amount}
            network={network}
            onConfirm={handleProceed}
          />
        )}
        
        <ProceedButton
          onClick={handleProceed}
          disabled={!isFormValid}
          loading={loading}
        />
      </main>
      
      <BottomNav activeTab="services" />
    </div>
  );
};

export default MobileServicePage;