import { useMemo } from "react";
import { useTransactions } from "@/hooks/useTransactions";

/**
 * Returns the most frequently used network based on transaction history.
 * Pass the list of available networks and it returns the best default or null.
 */
export const useSmartNetworkDefault = (
  networks: Array<{ network_id: number; network_name: string }> | undefined,
  serviceType: "airtime" | "data"
) => {
  const { data: transactions } = useTransactions(50);

  return useMemo(() => {
    if (!transactions || !networks || networks.length === 0) return null;

    const serviceTxns = transactions.filter((t) => t.type === serviceType && t.status === "success");
    if (serviceTxns.length === 0) return null;

    // Count network usage from metadata
    const counts: Record<string, number> = {};
    for (const t of serviceTxns) {
      const meta = t.metadata as any;
      const networkName = meta?.network_name || meta?.network;
      if (networkName) {
        counts[networkName] = (counts[networkName] || 0) + 1;
      }
    }

    const topNetwork = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    if (!topNetwork) return null;

    return networks.find(
      (n) => n.network_name.toLowerCase() === topNetwork[0].toLowerCase()
    ) || null;
  }, [transactions, networks, serviceType]);
};
