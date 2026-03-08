import mtnLogo from "@/assets/mtn-logo.png";
import { cn } from "@/lib/utils";

interface NetworkIconProps {
  networkName: string;
  className?: string;
}

export const NetworkIcon = ({ networkName, className }: NetworkIconProps) => {
  const name = networkName.toUpperCase();

  if (name === "MTN") {
    return (
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-yellow-50 overflow-hidden", className)}>
        <img src={mtnLogo} alt="MTN" className="w-8 h-8 object-contain" />
      </div>
    );
  }

  const styles: Record<string, string> = {
    GLO: "bg-green-100 text-green-700",
    AIRTEL: "bg-red-100 text-red-700",
    "9MOBILE": "bg-emerald-100 text-emerald-700",
  };

  return (
    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black", styles[name] || "bg-purple-100 text-purple-700", className)}>
      {networkName[0]}
    </div>
  );
};
