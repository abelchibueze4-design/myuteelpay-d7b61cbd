import mtnLogo from "@/assets/mtn-logo.png";
import gloLogo from "@/assets/glo-logo.png";
import airtelLogo from "@/assets/airtel-logo.png";
import nineMobileLogo from "@/assets/9mobile-logo.png";
import { cn } from "@/lib/utils";

interface NetworkIconProps {
  networkName: string;
  className?: string;
}

const networkLogos: Record<string, { src: string; bg: string }> = {
  MTN: { src: mtnLogo, bg: "bg-yellow-50" },
  GLO: { src: gloLogo, bg: "bg-green-50" },
  AIRTEL: { src: airtelLogo, bg: "bg-red-50" },
  "9MOBILE": { src: nineMobileLogo, bg: "bg-emerald-50" },
};

export const NetworkIcon = ({ networkName, className }: NetworkIconProps) => {
  const name = networkName.toUpperCase();
  const logo = networkLogos[name];

  if (logo) {
    return (
      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden", logo.bg, className)}>
        <img src={logo.src} alt={networkName} className="w-6 h-6 object-contain" />
      </div>
    );
  }

  return (
    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black bg-purple-100 text-purple-700", className)}>
      {networkName[0]}
    </div>
  );
};
