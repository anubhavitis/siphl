"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useSpotMetadata,
  useAllMids,
  useInitializeAgent,
} from "@/lib/hyperliquid/hooks";
import { useUserSIPs } from "@/lib/hyperliquid/hooks-sip";
import { Loader2, Plus } from "lucide-react";
import { useSignMessage, useAccount } from "wagmi";
import { createSIP } from "@/lib/hyperliquid/sip-service";
import { toast } from "sonner";
import { useHyperliquidStore } from "@/lib/hyperliquid/store";
import { useQuery } from "@tanstack/react-query";
import { Address } from "viem";

export function CreateSipModal() {
  const [open, setOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<string>("");
  const [monthlyAmount, setMonthlyAmount] = useState<number>(1000);
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { address } = useAccount();
  const { data: spotMeta, isLoading: isLoadingMeta } = useSpotMetadata();
  const { data: allMids, isLoading: isLoadingPrices } = useAllMids();
  const { data: agentData } = useInitializeAgent();
  const { infoClient } = useHyperliquidStore();

  const { data: existingSIPs } = useUserSIPs();
  const { signMessageAsync } = useSignMessage();

  const builderAddress = process.env.NEXT_PUBLIC_BUILDER_ADDRESS as Address;

  // Check builder fee approval status
  const { data: approvedBuilderFee } = useQuery({
    queryKey: ["builder-fee-approval", address, builderAddress],
    queryFn: async () => {
      if (!infoClient || !address || !builderAddress) return null;
      const fee = await infoClient.maxBuilderFee({
        user: address,
        builder: builderAddress,
      });
      return fee;
    },
    enabled: !!infoClient && !!address && !!builderAddress,
  });

  const isAgentApproved = agentData?.initialized || false;
  const isBuilderApproved = approvedBuilderFee && approvedBuilderFee > 0;
  const canCreateSIP = isAgentApproved && isBuilderApproved;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate monthly amount
    if (!selectedAsset) {
      setError("Please select an asset");
      return;
    }

    // Find the selected asset to get its index
    const selectedAssetData = assetsWithPrices.find(
      (asset) => asset?.name === selectedAsset,
    );

    if (!selectedAssetData) {
      setError("Invalid asset selected");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create SIP with signature verification
      const result = await createSIP({
        assetName: selectedAsset,
        assetIndex: selectedAssetData.index,
        monthlyAmountUsdc: monthlyAmount,
        signMessage: async (message: string) => {
          const signature = await signMessageAsync({
            message,
          });
          return signature;
        },
      });

      if (result.success) {
        toast.success("SIP created successfully", {
          description: `Monthly investment of ${monthlyAmount} USDC in ${selectedAsset}`,
        });

        // Reset form and close modal
        setSelectedAsset("");
        setMonthlyAmount(1000);
        setOpen(false);
      } else {
        setError(result.error || "Failed to create SIP");
      }
    } catch (error: any) {
      console.error("SIP creation error:", error);
      setError(error.message || "Failed to create SIP");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isLoadingMeta || isLoadingPrices;

  // Get assets that already have active/paused SIPs
  const existingAssetNames = new Set(
    existingSIPs?.map((sip: any) => sip.asset_name) || [],
  );

  // Get sorted assets with prices
  const assetsWithPrices =
    spotMeta && allMids
      ? spotMeta.universe
          .map((pair: any) => {
            if (pair.tokens[1] !== 0) return null;
            const tokenIndex = pair.tokens[0]; // Base token index
            const token = spotMeta.tokens[tokenIndex];
            if (!token) return null;

            return {
              name: token.name,
              index: pair.index,
              price: allMids[`@${pair.index}`] || "N/A",
              hasExistingSIP: existingAssetNames.has(token.name),
            };
          })
          .filter(Boolean) // Remove nulls
          .sort((a: any, b: any) => a.name.localeCompare(b.name))
      : [];

  const getTooltipMessage = () => {
    if (!isAgentApproved && !isBuilderApproved) {
      return "Please approve agent and builder to create SIPs";
    }
    if (!isAgentApproved) {
      return "Please approve agent to create SIPs";
    }
    if (!isBuilderApproved) {
      return "Please approve builder to create SIPs";
    }
    return "";
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <DialogTrigger asChild>
                <Button
                  className="inline-flex items-center gap-2"
                  disabled={!canCreateSIP}
                >
                  <Plus className="w-4 h-4" />
                  SIP
                </Button>
              </DialogTrigger>
            </span>
          </TooltipTrigger>
          {!canCreateSIP && (
            <TooltipContent>
              <p>{getTooltipMessage()}</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New SIP</DialogTitle>
          <DialogDescription>
            Set up a systematic investment plan for spot assets on Hyperliquid.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Asset Selection */}
            <div className="space-y-2">
              <Label htmlFor="asset">Select Asset</Label>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Select value={selectedAsset} onValueChange={setSelectedAsset}>
                  <SelectTrigger id="asset">
                    <SelectValue placeholder="Choose an asset" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="h-96 overflow-y-auto">
                      {assetsWithPrices.map((asset) => (
                        <SelectItem
                          key={asset?.index}
                          value={asset?.name || ""}
                          disabled={asset?.hasExistingSIP}
                        >
                          {asset?.name} - ${asset?.price}
                          {asset?.hasExistingSIP && (
                            <span className="text-xs text-muted-foreground ml-2">
                              (Already has SIP)
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </div>
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Monthly Investment Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Monthly Investment (USDC)</Label>
              <Input
                id="amount"
                type="number"
                min="1000"
                step="1"
                placeholder="Min. 1000 USDC"
                value={monthlyAmount}
                onChange={(e) => setMonthlyAmount(Number(e.target.value))}
                disabled={isLoading}
              />
              <div className="flex justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  Minimum investment: 1000 USDC
                </p>
                {monthlyAmount >= 1000 && (
                  <p className="text-xs text-emerald-600">
                    ~{(monthlyAmount / 90).toFixed(2)} USDC every 8 hours
                  </p>
                )}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-md bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-3">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create SIP"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
