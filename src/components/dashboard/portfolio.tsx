"use client";

import { useMemo } from "react";
import { Address } from "viem";
import {
  useGetBalances,
  useAllMids,
  useSpotMetadata,
} from "@/lib/hyperliquid/hooks";
import {
  useUserSIPs,
  useCancelSIP,
  usePauseSIP,
  useResumeSIP,
} from "@/lib/hyperliquid/hooks-sip";
import { Header } from "@/components/ui/header";
import { UnifiedDepositModal } from "./unified-deposit-modal";
import { CreateSipModal } from "@/components/sip/create-sip-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Wallet, BarChart3 } from "lucide-react";
import { PortfolioCard, PortfolioItem } from "./portfolio-card";

function getSpotPrice(
  coin: string,
  spotMeta: any,
  allMids: Record<string, string> | undefined,
): number | null {
  if (coin === "USDC") return 1;
  if (!spotMeta || !allMids) return null;

  const tokenInfo = spotMeta.tokens.find((t: any) => t.name === coin);
  if (!tokenInfo) return null;

  // USDC = token 0, USDH = token 360 (treat as equivalent)
  const STABLE_QUOTE_TOKENS = [0, 360];
  const spotPair = spotMeta.universe.find(
    (u: any) =>
      u.tokens[0] === tokenInfo.index &&
      STABLE_QUOTE_TOKENS.includes(u.tokens[1]),
  );
  if (!spotPair) return null;

  const price = parseFloat(allMids[`@${spotPair.index}`] || "0");
  return price > 0 ? price : null;
}

function buildPortfolioItems(
  balances: any[] | undefined,
  sips: any[] | undefined,
  spotMeta: any,
  allMids: Record<string, string> | undefined,
): PortfolioItem[] {
  const map = new Map<string, PortfolioItem>();

  // Add balance entries
  const nonZero = balances?.filter((b) => parseFloat(b.total) > 0) ?? [];

  for (const b of nonZero) {
    const { coin, total, entryNtl } = b;
    const isUsdc = coin === "USDC";
    const totalNum = parseFloat(total);
    const entryNtlNum = parseFloat(entryNtl);
    const price = getSpotPrice(coin, spotMeta, allMids);
    const currentValue = isUsdc
      ? totalNum
      : price !== null
        ? totalNum * price
        : null;
    const avgBuyPrice =
      !isUsdc && entryNtlNum > 0 && totalNum > 0
        ? entryNtlNum / totalNum
        : null;
    const pnlPercent =
      !isUsdc && entryNtlNum > 0 && currentValue !== null
        ? ((currentValue - entryNtlNum) / entryNtlNum) * 100
        : null;

    map.set(coin, {
      coin,
      isUsdc,
      balance: totalNum,
      entryNtl: entryNtlNum,
      currentPrice: isUsdc ? 1 : price,
      currentValue,
      avgBuyPrice,
      pnlPercent,
      sip: null,
    });
  }

  // Merge SIP data
  if (sips) {
    for (const sip of sips) {
      const coin = sip.asset_name;
      const existing = map.get(coin);

      const sipData = {
        id: sip.id,
        monthlyAmount: sip.monthly_amount_usdc,
        status: sip.status,
      };

      if (existing) {
        map.set(coin, { ...existing, sip: sipData });
      } else {
        const price = getSpotPrice(coin, spotMeta, allMids);
        map.set(coin, {
          coin,
          isUsdc: false,
          balance: null,
          entryNtl: null,
          currentPrice: price,
          currentValue: null,
          avgBuyPrice: null,
          pnlPercent: null,
          sip: sipData,
        });
      }
    }
  }

  // Sort: USDC first, then by value descending
  return Array.from(map.values()).sort((a, b) => {
    if (a.isUsdc) return -1;
    if (b.isUsdc) return 1;
    return (b.currentValue ?? 0) - (a.currentValue ?? 0);
  });
}

function PortfolioSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-14" />
              </div>
              <Skeleton className="h-5 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

interface PortfolioProps {
  address: Address;
}

export function Portfolio({ address }: PortfolioProps) {
  const { data: balanceData, isLoading: balancesLoading } =
    useGetBalances(address);
  const { data: allMids } = useAllMids();
  const { data: spotMeta } = useSpotMetadata();
  const { data: sips, isLoading: sipsLoading } = useUserSIPs();

  const {
    mutate: cancelSIP,
    isPending: isCancelling,
    variables: cancellingId,
  } = useCancelSIP();
  const {
    mutate: pauseSIP,
    isPending: isPausing,
    variables: pausingId,
  } = usePauseSIP();
  const {
    mutate: resumeSIP,
    isPending: isResuming,
    variables: resumingId,
  } = useResumeSIP();

  const isLoading = balancesLoading || sipsLoading;

  const items = useMemo(
    () => buildPortfolioItems(balanceData?.balances, sips, spotMeta, allMids),
    [balanceData, sips, spotMeta, allMids],
  );

  const usdcItem = items.find((i) => i.isUsdc);
  const assetItems = items.filter((i) => !i.isUsdc);

  const totals = useMemo(() => {
    const nonUsdc = items.filter((i) => !i.isUsdc);
    const totalValue = items.reduce(
      (sum, item) => sum + (item.currentValue ?? 0),
      0,
    );
    const totalInvested = nonUsdc.reduce(
      (sum, item) => sum + (item.entryNtl ?? 0),
      0,
    );
    const pnl = totalValue - totalInvested - (usdcItem?.currentValue ?? 0);
    const pnlPercent = totalInvested > 0 ? (pnl / totalInvested) * 100 : 0;
    return { totalValue, totalInvested, pnl, pnlPercent };
  }, [items, usdcItem]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <Header title="Portfolio" description="Your spot balances and SIPs" />
        <div className="flex items-center gap-3">
          {!isLoading && items.length > 0 && (
            <Dialog>
              <DialogTrigger asChild>
                <button className="inline-flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm hover:bg-accent transition-colors">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Stats</span>
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[340px]">
                <DialogHeader>
                  <DialogTitle>Portfolio Summary</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">
                      Total Value
                    </span>
                    <span className="text-sm font-mono font-semibold">
                      $
                      {totals.totalValue.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">
                      Total Invested
                    </span>
                    <span className="text-sm font-mono font-semibold">
                      $
                      {totals.totalInvested.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">P&L</span>
                    <span
                      className={`text-sm font-mono font-semibold ${totals.pnl >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                    >
                      {totals.pnl >= 0 ? "+" : ""}$
                      {Math.abs(totals.pnl).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">P&L %</span>
                    <span
                      className={`text-sm font-mono font-semibold ${totals.pnlPercent >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                    >
                      {totals.pnlPercent >= 0 ? "+" : ""}
                      {totals.pnlPercent.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
          <UnifiedDepositModal
            trigger={
              <button className="inline-flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm hover:bg-accent transition-colors">
                <Wallet className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">USDC</span>
                <span className="font-mono">
                  {usdcItem?.balance !== null && usdcItem?.balance !== undefined
                    ? `$${usdcItem.balance.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`
                    : "--"}
                </span>
              </button>
            }
          />
          <CreateSipModal />
        </div>
      </div>

      {isLoading ? (
        <PortfolioSkeleton />
      ) : assetItems.length === 0 ? (
        <div className="rounded-lg border border-dashed py-8">
          <p className="text-center text-muted-foreground text-sm">
            No balances or SIPs yet. Deposit funds or create a SIP to get
            started.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {assetItems.map((item) => (
            <PortfolioCard
              key={item.coin}
              item={item}
              onPause={pauseSIP}
              onResume={resumeSIP}
              onCancel={cancelSIP}
              isPausing={isPausing && pausingId === item.sip?.id}
              isResuming={isResuming && resumingId === item.sip?.id}
              isCancelling={isCancelling && cancellingId === item.sip?.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
