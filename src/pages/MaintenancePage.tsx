import { Construction, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const MaintenancePage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md space-y-6">
        <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <Construction className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">Under Maintenance</h1>
        <p className="text-muted-foreground text-base leading-relaxed">
          We're currently performing scheduled maintenance to improve your experience. 
          Please check back shortly — we'll be up and running soon!
        </p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    </div>
  );
};

export default MaintenancePage;
