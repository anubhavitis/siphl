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

  const spotPair = spotMeta.universe.find(
    (u: any) => u.tokens[0] === tokenInfo.index && u.tokens[1] === 0,
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4 space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-14" />
            </div>
            <Skeleton className="h-8 w-28" />
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
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

  const totalValue = useMemo(
    () => items.reduce((sum, item) => sum + (item.currentValue ?? 0), 0),
    [items],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <Header title="Portfolio" description="Your spot balances and SIPs" />
          {!isLoading && items.length > 0 && (
            <p className="text-lg font-mono font-semibold">
              {`$${totalValue.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <UnifiedDepositModal />
          <CreateSipModal />
        </div>
      </div>

      {isLoading ? (
        <PortfolioSkeleton />
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-dashed py-8">
          <p className="text-center text-muted-foreground text-sm">
            No balances or SIPs yet. Deposit funds or create a SIP to get
            started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
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
