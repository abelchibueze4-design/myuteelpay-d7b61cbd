import { useMemo } from "react";

interface PasswordStrengthIndicatorProps {
  password: string;
}

interface StrengthResult {
  score: number; // 0-4
  label: string;
  color: string;
  feedback: string[];
}

const calculatePasswordStrength = (password: string): StrengthResult => {
  const feedback: string[] = [];
  let score = 0;

  if (!password) {
    return { score: 0, label: "No password", color: "bg-gray-200", feedback: [] };
  }

  // Length check
  if (password.length >= 8) {
    score++;
  } else {
    feedback.push("At least 8 characters");
  }

  // Uppercase check
  if (/[A-Z]/.test(password)) {
    score++;
  } else {
    feedback.push("Add uppercase letters");
  }

  // Lowercase check
  if (/[a-z]/.test(password)) {
    score++;
  } else {
    feedback.push("Add lowercase letters");
  }

  // Number check
  if (/[0-9]/.test(password)) {
    score++;
  } else {
    feedback.push("Add numbers");
  }

  // Special character check
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score++;
  } else {
    feedback.push("Add special characters");
  }

  // Normalize score to 0-4
  score = Math.min(4, Math.ceil(score * 0.8));

  const strengthMap = {
    0: { label: "Very Weak", color: "bg-red-500" },
    1: { label: "Weak", color: "bg-orange-500" },
    2: { label: "Fair", color: "bg-yellow-500" },
    3: { label: "Good", color: "bg-blue-500" },
    4: { label: "Strong", color: "bg-green-500" },
  };

  const strength = strengthMap[score as keyof typeof strengthMap] || strengthMap[0];

  return {
    score,
    label: strength.label,
    color: strength.color,
    feedback: feedback.slice(0, 2), // Show top 2 suggestions
  };
};

export const PasswordStrengthIndicator = ({
  password,
}: PasswordStrengthIndicatorProps) => {
  const strength = useMemo(
    () => calculatePasswordStrength(password),
    [password]
  );

  if (!password) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${strength.color} transition-all duration-300`}
            style={{ width: `${((strength.score + 1) / 5) * 100}%` }}
          />
        </div>
        <span className="text-xs font-semibold text-muted-foreground">
          {strength.label}
        </span>
      </div>
      {strength.feedback.length > 0 && (
        <ul className="text-xs text-muted-foreground space-y-1">
          {strength.feedback.map((tip, idx) => (
            <li key={idx} className="flex items-center gap-1">
              <span className="text-yellow-600">•</span> {tip}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
