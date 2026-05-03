/**
 * Agent initialization service layer
 *
 * This module contains all business logic for initializing Hyperliquid agents.
 * All functions are pure and can be tested independently of React.
 *
 * @module agent-service
 */

import { Address, isAddressEqual } from "viem";
import * as hl from "@nktkas/hyperliquid";

/**
 * Result of agent initialization
 */
export interface AgentInitResult {
  agentAddress: Address;
  initialized: boolean;
}

/**
 * Parameters for initializing an agent
 */
export interface InitializeAgentParams {
  userAddress: Address;
  infoClient: hl.InfoClient | null;
  exchangeClient: hl.ExchangeClient | null;
  initExchangeClientWithWallet: (walletClient: any) => Promise<void>;
  getWalletClient: () => Promise<any>;
}

/**
 * Get existing agent or create a new one via API
 * Returns only agent address (never private key - that stays on backend)
 *
 * @param userAddress - The user's wallet address
 * @returns Agent address and approval status
 */
export async function getOrCreateAgent(userAddress: Address): Promise<{
  agentAddress: Address;
  approved: boolean;
}> {
  // Try to get existing agent
  const getResponse = await fetch(`/api/agent?walletAddress=${userAddress}`);
  const existingAgent = await getResponse.json();

  if (existingAgent.agentAddress) {
    return {
      agentAddress: existingAgent.agentAddress,
      approved: existingAgent.approved,
    };
  }

  // Create new agent
  const createResponse = await fetch("/api/agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ walletAddress: userAddress }),
  });

  const newAgent = await createResponse.json();

  if (!newAgent.agentAddress) {
    throw new Error("Failed to create agent");
  }

  return {
    agentAddress: newAgent.agentAddress,
    approved: newAgent.approved || false,
  };
}

// Removed: createAgentAccount - no longer needed on frontend
// Agent private keys never leave the backend

/**
 * Check if an agent is already approved for a user
 *
 * @param infoClient - Hyperliquid info client
 * @param userAddress - The user's wallet address
 * @param agentAddress - The agent's wallet address
 * @returns true if agent is approved, false otherwise
 */
export async function checkAgentApproval(
  infoClient: hl.InfoClient | null,
  userAddress: Address,
  agentAddress: Address,
): Promise<boolean> {
  if (!infoClient) {
    return false;
  }

  try {
    const resp = await infoClient.extraAgents({ user: userAddress });
    console.log(
      "🚀 ~ checkAgentApproval ~ resp:",
      resp,
      "agentAddress",
      agentAddress,
    );

    if (!resp) {
      return false;
    }

    const found = resp.find((agent: any) => {
      return isAddressEqual(agent.address, agentAddress);
    });

    console.log("🚀 ~ checkAgentApproval ~ found:", found);
    return !!found;
  } catch (error) {
    console.warn("Failed to check agent approval status:", error);
    return false;
  }
}

/**
 * Approve an agent if it's not already approved
 *
 * @param exchangeClient - Hyperliquid exchange client
 * @param agentAddress - The agent's wallet address
 * @param isApproved - Whether the agent is already approved
 */
export async function approveAgentIfNeeded(
  exchangeClient: hl.ExchangeClient | null,
  agentAddress: Address,
  isApproved: boolean,
): Promise<void> {
  if (isApproved) {
    console.log("Agent already approved, skipping approval step");
    return;
  }

  if (!exchangeClient) {
    throw new Error("Exchange client not initialized");
  }

  try {
    const environment = process.env.NEXT_PUBLIC_ENVIRONMENT || "development";
    await exchangeClient.approveAgent({
      agentAddress,
      agentName: environment === "local" ? "Siphl L Agent" : "Siphl Agent",
    });
    console.log("Agent approved successfully");
  } catch (error: any) {
    // If approval fails, log but don't throw - agent might already be approved
    console.warn(
      "Agent approval failed (might already be approved):",
      error?.message || error,
    );
  }
}

/**
 * Approve builder fee for a specific builder address
 *
 * @param exchangeClient - Hyperliquid exchange client
 * @param builderAddress - Builder address to approve
 * @param maxFeeRate - Maximum fee rate (e.g., "0.01%")
 */
export async function approveBuilderFee(
  exchangeClient: hl.ExchangeClient | null,
  builderAddress: Address,
  maxFeeRate: string,
): Promise<void> {
  if (!exchangeClient) {
    throw new Error("Exchange client not initialized");
  }

  console.log("🚀 ~ approveBuilderFee ~ builderAddress:", builderAddress);
  console.log("🚀 ~ approveBuilderFee ~ maxFeeRate:", maxFeeRate);

  try {
    const result = await exchangeClient.approveBuilderFee({
      builder: builderAddress,
      maxFeeRate,
    });
    console.log("🚀 ~ approveBuilderFee ~ result:", result);
    console.log(`Builder fee approved: ${builderAddress} at ${maxFeeRate}`);
  } catch (error: any) {
    console.error("Failed to approve builder fee:", error?.message || error);
    console.error("🚀 ~ approveBuilderFee ~ error:", error);
    throw error;
  }
}

/**
 * Fetch agent info without triggering any signatures
 * This is safe to call automatically on page load
 *
 * @param params - Initialization parameters
 * @returns Agent info result
 */
export async function fetchAgentInfo(
  userAddress: Address,
  infoClient: hl.InfoClient | null,
): Promise<{ agentAddress: Address; isApproved: boolean }> {
  // Step 1: Get or create agent via API (returns only address, never private key)
  const { agentAddress, approved } = await getOrCreateAgent(userAddress);

  console.log("agentAddress", agentAddress, "approved (db)", approved);

  // Step 2: Check if agent is already approved on Hyperliquid
  const isApproved = await checkAgentApproval(
    infoClient,
    userAddress,
    agentAddress,
  );

  console.log("isApproved (chain)", isApproved);

  return {
    agentAddress,
    isApproved,
  };
}

/**
 * Approve an agent - this requires user signature
 * Should only be called when user explicitly clicks "Approve Agent"
 *
 * @param params - Parameters including the exchange client
 * @returns Whether approval was successful
 */
export async function approveAgent(
  exchangeClient: hl.ExchangeClient,
  infoClient: hl.InfoClient | null,
  userAddress: Address,
  agentAddress: Address,
): Promise<boolean> {
  // Approve agent on Hyperliquid (this triggers a signature request)
  console.log("Approving agent");
  await approveAgentIfNeeded(exchangeClient, agentAddress, false);

  // Check if approval succeeded
  console.log("Checking agent approval");
  const isApproved = await checkAgentApproval(
    infoClient,
    userAddress,
    agentAddress,
  );
  console.log("isApproved", isApproved);

  // If approved, mark in DB
  if (isApproved) {
    await fetch("/api/agent/approve", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletAddress: userAddress }),
    });
  }

  return isApproved;
}

/**
 * @deprecated Use fetchAgentInfo and approveAgent separately
 * Main orchestrator function that initializes an agent
 */
export async function initializeAgent(
  params: InitializeAgentParams,
): Promise<AgentInitResult> {
  const { userAddress, infoClient } = params;

  // Only fetch agent info - don't auto-approve
  const { agentAddress, isApproved } = await fetchAgentInfo(
    userAddress,
    infoClient,
  );

  return {
    agentAddress,
    initialized: isApproved,
  };
}
