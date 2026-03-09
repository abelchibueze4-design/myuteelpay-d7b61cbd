import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

const BIOMETRIC_STORAGE_KEY = "biometric_credential_id";
const BIOMETRIC_ENABLED_KEY = "biometric_enabled";

export const useBiometricAuth = () => {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if WebAuthn is supported
  useEffect(() => {
    const checkSupport = async () => {
      if (window.PublicKeyCredential) {
        try {
          const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          setIsSupported(available);
        } catch {
          setIsSupported(false);
        }
      }
    };
    checkSupport();
  }, []);

  // Load saved state
  useEffect(() => {
    if (user?.id) {
      const credentialId = localStorage.getItem(`${BIOMETRIC_STORAGE_KEY}_${user.id}`);
      const enabled = localStorage.getItem(`${BIOMETRIC_ENABLED_KEY}_${user.id}`) === "true";
      setIsRegistered(!!credentialId);
      setIsEnabled(enabled && !!credentialId);
    }
  }, [user?.id]);

  // Register biometric credential
  const register = useCallback(async (): Promise<boolean> => {
    if (!user?.id || !isSupported) {
      setError("Biometrics not supported on this device");
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: {
            name: "UteelPay",
            id: window.location.hostname,
          },
          user: {
            id: new TextEncoder().encode(user.id),
            name: user.email || "user",
            displayName: user.email || "User",
          },
          pubKeyCredParams: [
            { alg: -7, type: "public-key" },  // ES256
            { alg: -257, type: "public-key" }, // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required",
          },
          timeout: 60000,
        },
      }) as PublicKeyCredential;

      if (credential) {
        const credentialId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
        localStorage.setItem(`${BIOMETRIC_STORAGE_KEY}_${user.id}`, credentialId);
        localStorage.setItem(`${BIOMETRIC_ENABLED_KEY}_${user.id}`, "true");
        setIsRegistered(true);
        setIsEnabled(true);
        return true;
      }
      return false;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to register biometrics";
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user?.email, isSupported]);

  // Authenticate with biometrics
  const authenticate = useCallback(async (): Promise<boolean> => {
    if (!user?.id || !isSupported || !isEnabled) {
      return false;
    }

    const storedCredentialId = localStorage.getItem(`${BIOMETRIC_STORAGE_KEY}_${user.id}`);
    if (!storedCredentialId) {
      setError("No biometric credential found");
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const credentialIdArray = Uint8Array.from(atob(storedCredentialId), c => c.charCodeAt(0));

      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge,
          allowCredentials: [{
            id: credentialIdArray,
            type: "public-key",
            transports: ["internal"],
          }],
          userVerification: "required",
          timeout: 60000,
        },
      });

      return !!assertion;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Biometric authentication failed";
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, isSupported, isEnabled]);

  // Toggle biometric enabled state
  const toggleEnabled = useCallback((enabled: boolean) => {
    if (!user?.id) return;
    
    if (enabled && !isRegistered) {
      // Need to register first
      return register();
    }
    
    localStorage.setItem(`${BIOMETRIC_ENABLED_KEY}_${user.id}`, enabled ? "true" : "false");
    setIsEnabled(enabled);
    return Promise.resolve(true);
  }, [user?.id, isRegistered, register]);

  // Remove biometric credential
  const remove = useCallback(() => {
    if (!user?.id) return;
    localStorage.removeItem(`${BIOMETRIC_STORAGE_KEY}_${user.id}`);
    localStorage.removeItem(`${BIOMETRIC_ENABLED_KEY}_${user.id}`);
    setIsRegistered(false);
    setIsEnabled(false);
  }, [user?.id]);

  return {
    isSupported,
    isEnabled,
    isRegistered,
    isLoading,
    error,
    register,
    authenticate,
    toggleEnabled,
    remove,
  };
};
