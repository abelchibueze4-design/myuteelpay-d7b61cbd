import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { SetupTransactionPinModal } from "@/components/SetupTransactionPinModal";

interface DashboardWrapperProps {
  children: React.ReactNode;
}

export const DashboardWrapper = ({ children }: DashboardWrapperProps) => {
  const { user, checkPinRequired } = useAuth();
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [isCheckingPin, setIsCheckingPin] = useState(true);

  useEffect(() => {
    const checkPin = async () => {
      if (user?.id) {
        const pinRequired = await checkPinRequired();
        setShowPinSetup(pinRequired);
      }
      setIsCheckingPin(false);
    };

    checkPin();
  }, [user?.id, checkPinRequired]);

  if (isCheckingPin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      <SetupTransactionPinModal
        open={showPinSetup}
        onComplete={() => setShowPinSetup(false)}
        isRequired={true}
      />
    </>
  );
};
