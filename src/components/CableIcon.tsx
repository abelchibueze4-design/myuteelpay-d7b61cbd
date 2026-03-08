import dstvLogo from "@/assets/dstv-logo.png";
import gotvLogo from "@/assets/gotv-logo.png";
import startimesLogo from "@/assets/startimes-logo.png";
import { cn } from "@/lib/utils";
import { Tv } from "lucide-react";

interface CableIconProps {
  cableName: string;
  className?: string;
}

const cableLogos: Record<string, { src: string; bg: string }> = {
  DSTV: { src: dstvLogo, bg: "bg-blue-50" },
  GOTV: { src: gotvLogo, bg: "bg-orange-50" },
  STARTIMES: { src: startimesLogo, bg: "bg-red-50" },
};

export const CableIcon = ({ cableName, className }: CableIconProps) => {
  const name = cableName.toUpperCase();
  const logo = cableLogos[name];

  if (logo) {
    return (
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden", logo.bg, className)}>
        <img src={logo.src} alt={cableName} className="w-8 h-8 object-contain" />
      </div>
    );
  }

  return (
    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-purple-100 text-purple-700", className)}>
      <Tv className="w-5 h-5" />
    </div>
  );
};
