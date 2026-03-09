import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PageBackButtonProps {
  className?: string;
}

export const PageBackButton = ({ className = "" }: PageBackButtonProps) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(-1)}
      className={`w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-primary-foreground hover:bg-white/20 transition-colors ${className}`}
      aria-label="Go back"
    >
      <ArrowLeft className="w-5 h-5" />
    </button>
  );
};
