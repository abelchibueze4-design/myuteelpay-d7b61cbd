import { useEffect, useState } from "react";
import { useMaintenanceMode } from "@/hooks/useMaintenanceMode";
import MaintenancePage from "@/pages/MaintenancePage";

interface DashboardWrapperProps {
  children: React.ReactNode;
}

export const DashboardWrapper = ({ children }: DashboardWrapperProps) => {
  const { isMaintenanceMode, isLoading: maintenanceLoading } = useMaintenanceMode();

  if (maintenanceLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (isMaintenanceMode) {
    return <MaintenancePage />;
  }

  return <>{children}</>;
};
