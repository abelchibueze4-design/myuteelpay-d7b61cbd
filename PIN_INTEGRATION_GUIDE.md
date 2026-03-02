# Transaction PIN Integration Guide

This file shows how to integrate Transaction PIN verification into your transaction components.

## Usage in Transaction Components

### Example: Airtime Purchase with PIN Verification

```tsx
import { useState } from "react";
import { PinVerificationDialog } from "@/components/PinVerificationDialog";
import { useTransactionPinVerification } from "@/hooks/useTransactionPinVerification";
import { Button } from "@/components/ui/button";

export const AirtimePurchase = () => {
  const { verifyPin, checkIfPinRequired, isLoading, error } = useTransactionPinVerification();
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pinRequired, setPinRequired] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState<any>(null);

  const handleProceedTransaction = async () => {
    // Check if PIN is required
    const pinRequired = await checkIfPinRequired();
    if (pinRequired) {
      setPinRequired(true);
      setShowPinDialog(true);
      setPendingTransaction({
        amount: 1000,
        operator: "MTN",
        // ... other transaction details
      });
    } else {
      // Proceed without PIN
      await completeTransaction();
    }
  };

  const handlePinVerify = async (pin: string): Promise<boolean> => {
    const isValid = await verifyPin(pin);
    if (isValid) {
      await completeTransaction();
      return true;
    }
    return false;
  };

  const completeTransaction = async () => {
    try {
      // Your transaction logic here
      console.log("Transaction completed:", pendingTransaction);
      setShowPinDialog(false);
      setPendingTransaction(null);
    } catch (err) {
      console.error("Transaction failed:", err);
    }
  };

  return (
    <div>
      <Button onClick={handleProceedTransaction}>
        Complete Purchase
      </Button>

      <PinVerificationDialog
        open={showPinDialog}
        onOpenChange={setShowPinDialog}
        onVerify={handlePinVerify}
        isLoading={isLoading}
        error={error}
        title="Verify Transaction PIN"
        description="Enter your PIN to complete this transaction"
      />
    </div>
  );
};
```

## Key Components

### 1. **useTransactionPinVerification Hook**
- `verifyPin(pin: string)` - Verifies a PIN
- `checkIfPinRequired()` - Checks if user has PIN enabled
- `isLoading` - Loading state
- `error` - Error message if any

### 2. **PinVerificationDialog Component**
- Shows a secure PIN entry dialog
- Validates PIN format (4-6 digits)
- Provides error feedback
- Prevents accidental dismissal during verification

### 3. **SetupTransactionPinModal Component**
- Used for initial PIN setup
- Can be required or optional
- Shows confirmation validation
- Used in DashboardWrapper for first-time users

## Transaction Flow with PIN

1. User initiates transaction
2. System checks if PIN is required
3. If required, PIN dialog appears
4. User enters PIN
5. System verifies PIN
6. If valid, transaction proceeds
7. If invalid, user gets error and can retry

## Database Schema

The PIN data is stored in the `profiles` table:
- `transaction_pin_enabled` (boolean) - Whether PIN is enabled
- `transaction_pin_hash` (text) - Hashed PIN (XOR encryption)

## Security Notes

⚠️ **Important:** The current implementation uses XOR encryption for demo purposes.
For production:
- Use a proper backend function for PIN hashing (bcrypt, argon2)
- Never store PIN on client-side without proper encryption
- Implement rate limiting for PIN verification attempts
- Log PIN verification attempts for security auditing
- Require re-authentication for sensitive PIN changes

## Testing

To test PIN verification:
1. User sets up PIN in Security settings
2. PIN is required for next transaction
3. SetupTransactionPinModal appears on first dashboard access if PIN not set
4. User can change/remove PIN in Security settings tab
