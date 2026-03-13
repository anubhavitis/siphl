"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useHyperliquidDeposit } from "@/lib/hooks/use-hyperliquid-deposit";
import { usePerpToSpotTransfer } from "@/lib/hooks/use-perp-to-spot-transfer";
import { Loader2, RefreshCw, Wallet } from "lucide-react";
import { MIN_DEPOSIT } from "@/lib/constants/hyperliquid";
import { toast } from "sonner";

interface UnifiedDepositModalProps {
  trigger?: React.ReactNode;
}

export function UnifiedDepositModal({ trigger }: UnifiedDepositModalProps) {
  const [open, setOpen] = useState(false);
  const [transferAmount, setTransferAmount] = useState<number>(0);
  const [depositAmount, setDepositAmount] = useState<number>(MIN_DEPOSIT);

  // Transfer hook
  const {
    transfer,
    isLoading: isTransferring,
    isSuccess: isTransferSuccess,
    perpBalance,
    refetchPerpBalance,
  } = usePerpToSpotTransfer();

  // Deposit hook
  const {
    deposit,
    isLoading: isDepositing,
    isSuccess: isDepositSuccess,
    balance: arbitrumBalance,
    refetchBalance: refetchArbitrumBalance,
  } = useHyperliquidDeposit();

  // Refetch balances when modal opens
  useEffect(() => {
    if (open) {
      refetchPerpBalance();
      refetchArbitrumBalance();
    }
  }, [open, refetchPerpBalance, refetchArbitrumBalance]);

  // Handle transfer success (don't close modal)
  useEffect(() => {
    if (isTransferSuccess) {
      setTransferAmount(0);
      toast.success("Transferred to Spot account!");
      refetchPerpBalance();
    }
  }, [isTransferSuccess, refetchPerpBalance]);

  // Handle deposit success (don't close modal, show message)
  useEffect(() => {
    if (isDepositSuccess) {
      setDepositAmount(MIN_DEPOSIT);
      toast.success("Deposit successful!", {
        description:
          "Funds will arrive in your Perp account in ~1 minute. Click refresh to check balance.",
      });
      refetchArbitrumBalance();
    }
  }, [isDepositSuccess, refetchArbitrumBalance]);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    await transfer(transferAmount);
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    await deposit(depositAmount);
  };

  const handleRefresh = () => {
    refetchPerpBalance();
    refetchArbitrumBalance();
    toast.info("Balances refreshed");
  };

  const perpBalanceNum = parseFloat(perpBalance);
  const arbitrumBalanceNum = parseFloat(arbitrumBalance);
  const hasPerpBalance = perpBalanceNum > 0;
  const hasInsufficientPerpBalance = transferAmount > perpBalanceNum;
  const hasInsufficientArbitrumBalance = depositAmount > arbitrumBalanceNum;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button className="inline-flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            Manage Balance
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Manage Balance</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              className="h-8 w-8"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Transfer to Spot Section */}
          <div className={!hasPerpBalance ? "opacity-50" : ""}>
            <form onSubmit={handleTransfer} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="transfer-amount">Transfer to Spot</Label>
                <Input
                  id="transfer-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={
                    hasPerpBalance ? "Enter amount" : "No Perp balance"
                  }
                  value={transferAmount || ""}
                  onChange={(e) => setTransferAmount(Number(e.target.value))}
                  disabled={!hasPerpBalance}
                />
                <div className="flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">
                    Available:{" "}
                    <span className="font-semibold">{perpBalance} USDC</span>
                  </p>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs"
                    onClick={() => setTransferAmount(perpBalanceNum)}
                    disabled={!hasPerpBalance}
                  >
                    Max
                  </Button>
                </div>
                {hasInsufficientPerpBalance && (
                  <p className="text-xs text-red-600 dark:text-red-400">
                    Insufficient balance
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={
                  !hasPerpBalance ||
                  isTransferring ||
                  transferAmount <= 0 ||
                  hasInsufficientPerpBalance
                }
              >
                {isTransferring ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Transferring...
                  </>
                ) : (
                  "Transfer to Spot"
                )}
              </Button>
            </form>
          </div>

          <div className="border-t"></div>

          {/* Deposit from Arbitrum Section */}
          <div>
            <form onSubmit={handleDeposit} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="deposit-amount">Deposit from Arbitrum</Label>
                <Input
                  id="deposit-amount"
                  type="number"
                  min={MIN_DEPOSIT}
                  step="0.01"
                  placeholder={`Min. ${MIN_DEPOSIT} USDC`}
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(Number(e.target.value))}
                />
                <div className="flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">
                    Min: {MIN_DEPOSIT} USDC · Arrives in ~1 min
                  </p>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs"
                    onClick={() => setDepositAmount(arbitrumBalanceNum)}
                  >
                    Max
                  </Button>
                </div>
                {hasInsufficientArbitrumBalance && (
                  <p className="text-xs text-red-600 dark:text-red-400">
                    Insufficient balance
                  </p>
                )}
              </div>

              <Button
                type="submit"
                variant="outline"
                className="w-full"
                disabled={
                  isDepositing ||
                  depositAmount < MIN_DEPOSIT ||
                  hasInsufficientArbitrumBalance
                }
              >
                {isDepositing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Depositing...
                  </>
                ) : (
                  "Deposit to Perp"
                )}
              </Button>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
