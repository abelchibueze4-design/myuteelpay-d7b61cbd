import { motion, AnimatePresence } from "framer-motion";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface TransactionResultScreenProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  success: boolean;
  title?: string;
  description?: string;
  onNewPurchase?: () => void;
  onDone?: () => void;
}

export const TransactionResultScreen = ({
  open,
  onOpenChange,
  success,
  title,
  description,
  onNewPurchase,
  onDone,
}: TransactionResultScreenProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm text-center border-none shadow-2xl rounded-3xl overflow-hidden">
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center py-4"
            >
              {/* Animated circle */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 200, damping: 12 }}
                className={`w-20 h-20 rounded-full flex items-center justify-center mb-5 ${
                  success
                    ? "bg-gradient-to-br from-emerald-400 to-emerald-600"
                    : "bg-gradient-to-br from-red-400 to-red-600"
                }`}
              >
                {/* Animated checkmark / X */}
                <motion.div
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  {success ? (
                    <Check className="w-10 h-10 text-white" strokeWidth={3} />
                  ) : (
                    <X className="w-10 h-10 text-white" strokeWidth={3} />
                  )}
                </motion.div>
              </motion.div>

              {/* Ripple effect */}
              <motion.div
                initial={{ scale: 0.5, opacity: 0.6 }}
                animate={{ scale: 2.5, opacity: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className={`absolute w-20 h-20 rounded-full ${
                  success ? "bg-emerald-400/30" : "bg-red-400/30"
                }`}
                style={{ top: "calc(50% - 80px)" }}
              />

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-xl font-extrabold text-foreground"
              >
                {title || (success ? "Transaction Successful!" : "Transaction Failed")}
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-sm text-muted-foreground mt-2 px-4"
              >
                {description ||
                  (success
                    ? "Your purchase was completed successfully."
                    : "Something went wrong. Please try again.")}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="flex gap-3 mt-6 w-full px-2"
              >
                {onNewPurchase && (
                  <Button
                    variant="outline"
                    className="flex-1 rounded-2xl h-12 font-bold"
                    onClick={onNewPurchase}
                  >
                    New Purchase
                  </Button>
                )}
                {onDone && (
                  <Button
                    variant="hero"
                    className="flex-1 rounded-2xl h-12 font-bold"
                    onClick={onDone}
                  >
                    Done
                  </Button>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};
