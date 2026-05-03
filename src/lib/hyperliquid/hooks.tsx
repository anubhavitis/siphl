"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useHyperliquidStore } from "./store";
import { Address } from "viem";
import { toast } from "sonner";
import { useAccount, useWalletClient } from "wagmi";
import { fetchAgentInfo, approveAgent } from "./agent-service";

// Initialize store on module load
if (typeof window !== "undefined") {
  useHyperliquidStore.getState().init();
}

export function useCheckUser(userAddress: Address) {
  const infoClient = useHyperliquidStore((state) => state.infoClient);

  return useQuery({
    queryKey: ["hyperliquid", "check-user"],
    queryFn: async () => {
      const resp = await infoClient?.userRole({ user: userAddress });
      return resp?.role === "user";
    },
    enabled: !!userAddress,
  });
}

export function useGetBalances(userAddress: Address) {
  const infoClient = useHyperliquidStore((state) => state.infoClient);
  return useQuery({
    queryKey: ["hyperliquid", "balances", userAddress],
    queryFn: async () => {
      return await infoClient?.spotClearinghouseState({ user: userAddress });
    },
    enabled: !!userAddress,
  });
}

/**
 * Hook to fetch agent info (no signature required)
 * This is safe to call automatically on page load
 */
export function useAgentInfo() {
  const { address } = useAccount();
  const infoClient = useHyperliquidStore((state) => state.infoClient);

  return useQuery({
    queryKey: ["hyperliquid", "agent-info", address],
    queryFn: async () => {
      if (!address) {
        throw new Error("No wallet connected");
      }
      return await fetchAgentInfo(address, infoClient);
    },
    enabled: !!address,
    retry: 2,
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook to approve agent (requires user signature)
 * Only triggers when user explicitly calls the mutation
 */
export function useApproveAgentMutation() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const queryClient = useQueryClient();
  const infoClient = useHyperliquidStore((state) => state.infoClient);
  const initExchangeClient = useHyperliquidStore(
    (state) => state.initExchangeClient,
  );
  const exchangeClient = useHyperliquidStore((state) => state.exchangeClient);

  return useMutation({
    mutationKey: ["hyperliquid", "approve-agent"],
    mutationFn: async (agentAddress: Address) => {
      if (!address) {
        throw new Error("No wallet connected");
      }
      if (!walletClient) {
        throw new Error("Wallet client not available");
      }

      // Initialize exchange client if not already done
      let client = exchangeClient;
      if (!client) {
        await initExchangeClient(walletClient);
        // Get the newly created client from the store
        client = useHyperliquidStore.getState().exchangeClient;
      }

      if (!client) {
        throw new Error("Failed to initialize exchange client");
      }

      return await approveAgent(client, infoClient, address, agentAddress);
    },
    onSuccess: (isApproved) => {
      if (isApproved) {
        toast.success("Agent approved successfully", {
          description: "You can now use the agent to trade",
        });
        // Invalidate agent info to refetch
        queryClient.invalidateQueries({
          queryKey: ["hyperliquid", "agent-info"],
        });
      } else {
        toast.error("Agent approval may have failed", {
          description: "Please try again",
        });
      }
    },
    onError: (error: any) => {
      toast.error("Failed to approve agent", {
        description: error?.message || "Please try again",
      });
    },
  });
}

/**
 * @deprecated Use useAgentInfo instead
 * Hook to initialize exchange and agent clients
 */
export function useInitializeAgent() {
  const agentInfo = useAgentInfo();

  // Map to old format for backwards compatibility
  return {
    ...agentInfo,
    data: agentInfo.data
      ? {
          agentAddress: agentInfo.data.agentAddress,
          initialized: agentInfo.data.isApproved,
        }
      : undefined,
  };
}

export function useGetAgentStatus(agentAddress?: Address) {
  const infoClient = useHyperliquidStore((state) => state.infoClient);
  const { address } = useAccount();

  return useQuery({
    queryKey: ["hyperliquid", "agent-status", address, agentAddress],
    enabled: !!address && !!agentAddress,
    queryFn: async () => {
      if (!address || !agentAddress || !infoClient) {
        return false;
      }

      const resp = await infoClient.extraAgents({
        user: address as Address,
      });

      if (!resp) {
        return false;
      }

      const found = resp.find((agent) => agent.address === agentAddress);
      return !!found;
    },
  });
}

export function useApproveAgent() {
  const exchangeClient = useHyperliquidStore((state) => state.exchangeClient);

  return useMutation({
    mutationKey: ["hyperliquid", "approve-agent"],
    mutationFn: async (agentAddress: Address) => {
      if (!exchangeClient) {
        throw new Error("Exchange client not initialized");
      }
      return await exchangeClient.approveAgent({
        agentAddress,
        agentName: "Siphl Investment Agent",
      });
    },
    onSuccess: () => {
      toast.success("Agent approved successfully", {
        description: "You can now use the agent to trade",
      });
    },
    onError: (error: any) => {
      toast.error("Failed to approve agent", {
        description: error?.message || "Please try again",
      });
    },
  });
}

/**
 * Hook to fetch spot metadata from Hyperliquid
 */
export function useSpotMetadata() {
  const infoClient = useHyperliquidStore((state) => state.infoClient);

  return useQuery({
    queryKey: ["hyperliquid", "spot-metadata"],
    queryFn: async () => {
      return await infoClient?.spotMeta();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to fetch all mid prices
 */
export function useAllMids() {
  const infoClient = useHyperliquidStore((state) => state.infoClient);

  return useQuery({
    queryKey: ["hyperliquid", "all-mids"],
    queryFn: async () => {
      return await infoClient?.allMids();
    },
    staleTime: 2 * 1000, // 30 seconds
    refetchInterval: 2 * 1000, // Refetch every 2 seconds
  });
}

/**
 * Hook to get spot asset by index
 */
export function useSpotAssetByIndex(assetIndex: number | undefined) {
  const { data: spotMeta } = useSpotMetadata();

  return useQuery({
    queryKey: ["hyperliquid", "spot-asset", "index", assetIndex],
    queryFn: async () => {
      if (!spotMeta || assetIndex === undefined) return null;
      return spotMeta.universe.find((u: any) => u.index === assetIndex) || null;
    },
    enabled: !!spotMeta && assetIndex !== undefined,
  });
}

/**
 * Hook to get spot asset by name
 */
export function useSpotAssetByName(assetName: string | undefined) {
  const { data: spotMeta } = useSpotMetadata();

  return useQuery({
    queryKey: ["hyperliquid", "spot-asset", "name", assetName],
    queryFn: async () => {
      if (!spotMeta || !assetName) return null;
      return (
        spotMeta.universe.find(
          (u: any) => u.name.toUpperCase() === assetName.toUpperCase(),
        ) || null
      );
    },
    enabled: !!spotMeta && !!assetName,
  });
}

/**
 * Hook to get current price for an asset
 */
export function useAssetPrice(assetName: string | undefined) {
  const { data: allMids } = useAllMids();

  return useQuery({
    queryKey: ["hyperliquid", "asset-price", assetName],
    queryFn: async () => {
      if (!allMids || !assetName) return null;
      return allMids[assetName] || null;
    },
    enabled: !!allMids && !!assetName,
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 10 * 1000, // Refetch every 10 seconds
  });
}

/**
 * Hook to fetch recent user fills (orders) from Hyperliquid
 * @param userAddress The user's wallet address to fetch fills for (not agent address)
 * @note Agent wallets only sign transactions - all orders are associated with the user's account
 */
export function useUserFills(userAddress?: Address) {
  const infoClient = useHyperliquidStore((state) => state.infoClient);

  return useQuery({
    queryKey: ["userFills", userAddress],
    queryFn: async () => {
      if (!userAddress || !infoClient) return [];
      const fills = await infoClient.userFills({ user: userAddress });
      // Limit to last 50 fills for performance
      return fills.slice(0, 50);
    },
    enabled: !!userAddress && !!infoClient,
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000, // Consider data stale after 30 seconds
  });
}
