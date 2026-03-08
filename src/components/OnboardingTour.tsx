import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, Smartphone, ShieldCheck, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const TOUR_KEY = "uteelpay-onboarding-done";

const steps = [
  {
    icon: Wallet,
    title: "Fund Your Wallet",
    description: "Tap 'Add Money' on your dashboard to load your wallet via card or bank transfer. It's instant!",
    color: "from-primary to-primary/80",
  },
  {
    icon: Smartphone,
    title: "Buy Airtime & Data",
    description: "Use Quick Actions to purchase airtime, data bundles, pay for cable TV, electricity and more.",
    color: "from-blue-500 to-blue-600",
  },
  {
    icon: ShieldCheck,
    title: "Set Up Your PIN",
    description: "Secure every transaction with a 4-digit PIN. You'll be prompted to set one on your first purchase.",
    color: "from-emerald-500 to-emerald-600",
  },
];

export const OnboardingTour = () => {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem(TOUR_KEY);
    if (!done) {
      // Small delay so dashboard renders first
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      handleDismiss();
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    localStorage.setItem(TOUR_KEY, "true");
  };

  if (!visible) return null;

  const current = steps[step];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
        onClick={handleDismiss}
      >
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="bg-card rounded-3xl p-6 max-w-sm w-full shadow-2xl relative"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-1 rounded-full hover:bg-secondary transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>

          <div className="flex flex-col items-center text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
              className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${current.color} flex items-center justify-center mb-4`}
            >
              <current.icon className="w-8 h-8 text-white" />
            </motion.div>

            <h3 className="text-lg font-extrabold text-foreground mb-2">{current.title}</h3>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{current.description}</p>

            {/* Progress dots */}
            <div className="flex gap-2 mb-5">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === step ? "w-6 bg-primary" : "w-1.5 bg-border"
                  }`}
                />
              ))}
            </div>

            <div className="flex gap-3 w-full">
              <Button
                variant="ghost"
                className="flex-1 text-muted-foreground font-bold"
                onClick={handleDismiss}
              >
                Skip
              </Button>
              <Button
                variant="hero"
                className="flex-1 rounded-2xl font-bold gap-1"
                onClick={handleNext}
              >
                {step < steps.length - 1 ? (
                  <>Next <ArrowRight className="w-4 h-4" /></>
                ) : (
                  "Get Started"
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
