import { motion, AnimatePresence } from "framer-motion";
import logoImg from "@/assets/logo.png";

interface TransactionProcessingOverlayProps {
  open: boolean;
  message?: string;
}

export const TransactionProcessingOverlay = ({
  open,
  message = "Processing transaction...",
}: TransactionProcessingOverlayProps) => {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="flex flex-col items-center gap-6"
          >
            {/* Logo with spinning ring */}
            <div className="relative w-28 h-28 flex items-center justify-center">
              {/* Outer spinning ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-primary border-r-primary/40"
              />
              {/* Inner pulsing glow */}
              <motion.div
                animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.15, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-1 rounded-full bg-primary/10"
              />
              {/* Logo */}
              <motion.img
                src={logoImg}
                alt="UteelPay"
                className="w-16 h-16 rounded-2xl object-contain relative z-10"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>

            {/* Processing text */}
            <div className="text-center space-y-2">
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-sm font-bold text-foreground"
              >
                {message}
              </motion.p>
              <motion.div className="flex items-center justify-center gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    className="w-1.5 h-1.5 rounded-full bg-primary"
                  />
                ))}
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-xs text-muted-foreground"
              >
                Please do not close this page
              </motion.p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
