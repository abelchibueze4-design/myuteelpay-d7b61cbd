import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { SetupTransactionPinModal } from "@/components/SetupTransactionPinModal";
import { useMaintenanceMode } from "@/hooks/useMaintenanceMode";
import MaintenancePage from "@/pages/MaintenancePage";

interface DashboardWrapperProps {
  children: React.ReactNode;
}

export const DashboardWrapper = ({ children }: DashboardWrapperProps) => {
  const { user, checkPinRequired } = useAuth();
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [isCheckingPin, setIsCheckingPin] = useState(true);
  const pinSetupCompleted = useRef(false);
  const { isMaintenanceMode, isLoading: maintenanceLoading } = useMaintenanceMode();

  useEffect(() => {
    let cancelled = false;
    const checkPin = async () => {
      if (user?.id && !pinSetupCompleted.current) {
        const pinRequired = await checkPinRequired();
        if (!cancelled) setShowPinSetup(pinRequired);
      }
      if (!cancelled) setIsCheckingPin(false);
    };

    checkPin();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handlePinComplete = () => {
    pinSetupCompleted.current = true;
    setShowPinSetup(false);
  };

  if (isCheckingPin || maintenanceLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show maintenance page for non-admin users
  if (isMaintenanceMode) {
    return <MaintenancePage />;
  }

  return (
    <>
      {children}
      <SetupTransactionPinModal
        open={showPinSetup}
        onComplete={handlePinComplete}
        isRequired={true}
      />
    </>
  );
};
