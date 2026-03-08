import ikedcLogo from "@/assets/ikedc-logo.png";
import ekedcLogo from "@/assets/ekedc-logo.png";
import aedcLogo from "@/assets/aedc-logo.png";
import kedcoLogo from "@/assets/kedco-logo.png";
import phedcLogo from "@/assets/phedc-logo.png";
import jedLogo from "@/assets/jed-logo.png";
import ibedcLogo from "@/assets/ibedc-logo.png";
import kaedcoLogo from "@/assets/kaedco-logo.png";
import eedcLogo from "@/assets/eedc-logo.png";
import bedcLogo from "@/assets/bedc-logo.png";
import yedcLogo from "@/assets/yedc-logo.png";
import { cn } from "@/lib/utils";
import { Zap } from "lucide-react";

interface DiscoIconProps {
  discoName: string;
  className?: string;
}

const discoLogos: Record<string, { src: string; bg: string }> = {
  IKEDC: { src: ikedcLogo, bg: "bg-blue-50" },
  "IKEJA ELECTRIC": { src: ikedcLogo, bg: "bg-blue-50" },
  EKEDC: { src: ekedcLogo, bg: "bg-orange-50" },
  "EKO ELECTRIC": { src: ekedcLogo, bg: "bg-orange-50" },
  AEDC: { src: aedcLogo, bg: "bg-green-50" },
  "ABUJA ELECTRIC": { src: aedcLogo, bg: "bg-green-50" },
  KEDCO: { src: kedcoLogo, bg: "bg-green-50" },
  "KANO ELECTRIC": { src: kedcoLogo, bg: "bg-green-50" },
  PHEDC: { src: phedcLogo, bg: "bg-blue-50" },
  "PH ELECTRIC": { src: phedcLogo, bg: "bg-blue-50" },
  "PORT HARCOURT ELECTRIC": { src: phedcLogo, bg: "bg-blue-50" },
  JED: { src: jedLogo, bg: "bg-orange-50" },
  "JOS ELECTRIC": { src: jedLogo, bg: "bg-orange-50" },
  IBEDC: { src: ibedcLogo, bg: "bg-blue-50" },
  "IBADAN ELECTRIC": { src: ibedcLogo, bg: "bg-blue-50" },
  KAEDCO: { src: kaedcoLogo, bg: "bg-green-50" },
  "KADUNA ELECTRIC": { src: kaedcoLogo, bg: "bg-green-50" },
  EEDC: { src: eedcLogo, bg: "bg-emerald-50" },
  "ENUGU ELECTRIC": { src: eedcLogo, bg: "bg-emerald-50" },
  BEDC: { src: bedcLogo, bg: "bg-red-50" },
  "BENIN ELECTRIC": { src: bedcLogo, bg: "bg-red-50" },
  YEDC: { src: yedcLogo, bg: "bg-green-50" },
  "YOLA ELECTRIC": { src: yedcLogo, bg: "bg-green-50" },
  "YOLA ELECTRICITY": { src: yedcLogo, bg: "bg-green-50" },
};

function findLogo(name: string) {
  const upper = name.toUpperCase();
  if (discoLogos[upper]) return discoLogos[upper];
  // Try partial match
  for (const key of Object.keys(discoLogos)) {
    if (upper.includes(key) || key.includes(upper)) return discoLogos[key];
  }
  return null;
}

export const DiscoIcon = ({ discoName, className }: DiscoIconProps) => {
  const logo = findLogo(discoName);

  if (logo) {
    return (
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden", logo.bg, className)}>
        <img src={logo.src} alt={discoName} className="w-10 h-10 object-contain" />
      </div>
    );
  }

  return (
    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center bg-amber-100 text-amber-700", className)}>
      <Zap className="w-5 h-5" />
    </div>
  );
};
