export const passwordRules = [
  { test: (p: string) => p.length >= 8, label: "At least 8 characters" },
  { test: (p: string) => /[A-Z]/.test(p), label: "At least one uppercase letter" },
  { test: (p: string) => /[a-z]/.test(p), label: "At least one lowercase letter" },
  { test: (p: string) => /[0-9]/.test(p), label: "At least one number" },
  { test: (p: string) => /[^A-Za-z0-9]/.test(p), label: "At least one special character" },
];

export const validatePassword = (password: string) => {
  return passwordRules.every((rule) => rule.test(password));
};

export const validateUsername = (username: string) => {
  return /^[A-Za-z][A-Za-z0-9_]{2,19}$/.test(username);
};
