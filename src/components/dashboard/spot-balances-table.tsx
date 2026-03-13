"use client";

import { Address } from "viem";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import {
  useGetBalances,
  useAllMids,
  useSpotMetadata,
} from "@/lib/hyperliquid/hooks";
import { SpotBalance } from "@/lib/hyperliquid/types";
import { Header } from "../ui/header";
import { UnifiedDepositModal } from "./unified-deposit-modal";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface SpotBalancesTableProps {
  address: Address;
}

interface SpotBalanceWithPnl extends SpotBalance {
  pnl?: number;
}

const createColumns = (
  allMids: any,
  spotMeta: any,
): ColumnDef<SpotBalanceWithPnl>[] => [
  {
    accessorKey: "coin",
    header: "Asset",
    cell: ({ row }) => {
      const coin = row.getValue("coin") as string;
      // USDC doesn't have a spot trading page
      if (coin === "USDC") {
        return <div className="font-medium">{coin}</div>;
      }
      // HyperCore uses U-prefixed names (UBTC, UETH) but UI uses BTC, ETH
      const uiName = coin.startsWith("U") ? coin.slice(1) : coin;
      return (
        <a
          href={`https://app.hyperliquid.xyz/trade/${uiName}/USDC`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium hover:underline"
        >
          {coin}
        </a>
      );
    },
  },
  {
    accessorKey: "total",
    header: "Balance",
    cell: ({ row }) => {
      const total = parseFloat(row.getValue("total") as string);
      return (
        <div className="font-mono">
          {total.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 8,
          })}
        </div>
      );
    },
  },
  {
    id: "entryPrice",
    header: "Avg Buy Price",
    cell: ({ row }) => {
      const { coin, total, entryNtl } = row.original;
      const totalNum = parseFloat(total);
      const entryNtlNum = parseFloat(entryNtl);

      // USDC always $1
      if (coin === "USDC") {
        return <div className="font-mono text-muted-foreground">$1.00</div>;
      }

      // No entry price if entryNtl is 0
      if (entryNtlNum === 0 || totalNum === 0) {
        return <div className="text-muted-foreground">—</div>;
      }

      // Calculate entry price
      const entryPrice = entryNtlNum / totalNum;

      return (
        <div className="font-mono text-muted-foreground">
          $
          {entryPrice.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 6,
          })}
        </div>
      );
    },
  },
  {
    id: "currentPrice",
    header: "Current Price",
    cell: ({ row }) => {
      const { coin } = row.original;

      // USDC always $1
      if (coin === "USDC") {
        return <div className="font-mono">$1.00</div>;
      }

      // Find asset index from metadata
      if (!spotMeta) {
        return <div className="text-muted-foreground">—</div>;
      }

      const tokenInfo = spotMeta.tokens.find((t: any) => t.name === coin);
      if (!tokenInfo) {
        return <div className="text-muted-foreground">—</div>;
      }

      // Find the spot pair (token paired with USDC)
      const spotPair = spotMeta.universe.find(
        (u: any) => u.tokens[0] === tokenInfo.index && u.tokens[1] === 0,
      );

      if (!spotPair || !allMids) {
        return <div className="text-muted-foreground">—</div>;
      }

      // Get current price
      const currentPrice = parseFloat(allMids[`@${spotPair.index}`] || "0");
      if (currentPrice === 0) {
        return <div className="text-muted-foreground">—</div>;
      }

      return (
        <div className="font-mono">
          $
          {currentPrice.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 6,
          })}
        </div>
      );
    },
  },
  {
    id: "invested",
    header: "Invested",
    cell: ({ row }) => {
      const { coin, entryNtl } = row.original;
      const ntl = parseFloat(entryNtl);
      if (coin === "USDC" || ntl <= 0) {
        return <div className="text-muted-foreground">—</div>;
      }
      return (
        <div className="font-mono">
          $
          {ntl.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
      );
    },
  },
  {
    id: "value",
    header: "Value",
    cell: ({ row }) => {
      const { coin, total, entryNtl } = row.original;
      const totalNum = parseFloat(total);
      const entryNtlNum = parseFloat(entryNtl);

      // USDC is 1:1 (neutral color)
      if (coin === "USDC") {
        return (
          <div className="font-mono">
            $
            {totalNum.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        );
      }

      // Find asset index from metadata
      if (!spotMeta) {
        return <div className="text-muted-foreground">—</div>;
      }

      const tokenInfo = spotMeta.tokens.find((t: any) => t.name === coin);
      if (!tokenInfo) {
        return <div className="text-muted-foreground">—</div>;
      }

      // Find the spot pair (token paired with USDC)
      const spotPair = spotMeta.universe.find(
        (u: any) => u.tokens[0] === tokenInfo.index && u.tokens[1] === 0,
      );

      if (!spotPair || !allMids) {
        return <div className="text-muted-foreground">—</div>;
      }

      // Get current price
      const currentPrice = parseFloat(allMids[`@${spotPair.index}`] || "0");
      if (currentPrice === 0) {
        return <div className="text-muted-foreground">—</div>;
      }

      // Calculate current value
      const currentValue = totalNum * currentPrice;

      // Determine color based on profit/loss
      let colorClass = "";
      if (entryNtlNum > 0) {
        colorClass =
          currentValue > entryNtlNum
            ? "text-green-600 dark:text-green-400"
            : currentValue < entryNtlNum
              ? "text-red-600 dark:text-red-400"
              : "";
      }

      return (
        <div className={`font-mono ${colorClass}`}>
          $
          {currentValue.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
      );
    },
  },
  {
    id: "pnl",
    header: "P&L %",
    cell: ({ row }) => {
      const { coin, total, entryNtl } = row.original;
      const totalNum = parseFloat(total);
      const entryNtlNum = parseFloat(entryNtl);

      // Handle USDC or zero entryNtl
      if (coin === "USDC" || entryNtlNum === 0) {
        return <div className="text-muted-foreground">—</div>;
      }

      // Find asset index from metadata
      if (!spotMeta) {
        return <div className="text-muted-foreground">—</div>;
      }

      const tokenInfo = spotMeta.tokens.find((t: any) => t.name === coin);
      if (!tokenInfo) {
        return <div className="text-muted-foreground">—</div>;
      }

      // Find the spot pair (token paired with USDC)
      const spotPair = spotMeta.universe.find(
        (u: any) => u.tokens[0] === tokenInfo.index && u.tokens[1] === 0,
      );

      if (!spotPair || !allMids) {
        return <div className="text-muted-foreground">—</div>;
      }

      // Get current price
      const currentPrice = parseFloat(allMids[`@${spotPair.index}`] || "0");
      if (currentPrice === 0) {
        return <div className="text-muted-foreground">—</div>;
      }

      // Calculate P&L %
      const currentValue = totalNum * currentPrice;
      const pnlPercent = ((currentValue - entryNtlNum) / entryNtlNum) * 100;

      // Color coding
      const colorClass =
        pnlPercent > 0
          ? "text-green-600 dark:text-green-400"
          : pnlPercent < 0
            ? "text-red-600 dark:text-red-400"
            : "text-muted-foreground";

      const prefix = pnlPercent > 0 ? "+" : "";

      return (
        <div className={`font-mono ${colorClass}`}>
          {prefix}
          {pnlPercent.toFixed(2)}%
        </div>
      );
    },
  },
];

export function SpotBalancesTable({ address }: SpotBalancesTableProps) {
  const { data, isLoading, error } = useGetBalances(address);
  const { data: allMids } = useAllMids();
  const { data: spotMeta } = useSpotMetadata();

  const columns = createColumns(allMids, spotMeta);

  const nonZeroBalances =
    data?.balances?.filter((balance) => parseFloat(balance.total) > 0) ?? [];

  const totalValue = nonZeroBalances.reduce((sum, balance) => {
    const { coin, total } = balance;
    const totalNum = parseFloat(total);

    if (coin === "USDC") {
      return sum + totalNum;
    }

    if (!spotMeta || !allMids) return sum;

    const tokenInfo = spotMeta.tokens.find((t: any) => t.name === coin);
    if (!tokenInfo) return sum;

    const spotPair = spotMeta.universe.find(
      (u: any) => u.tokens[0] === tokenInfo.index && u.tokens[1] === 0,
    );
    if (!spotPair) return sum;

    const currentPrice = parseFloat(allMids[`@${spotPair.index}`] || "0");
    return sum + totalNum * currentPrice;
  }, 0);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Avg Buy Price</TableHead>
                <TableHead>Current Price</TableHead>
                <TableHead>Invested</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>P&L %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(3)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-12" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center min-h-[200px]">
          <p className="text-destructive">Error loading balances</p>
        </div>
      );
    }

    return (
      <div>
        <DataTable
          columns={columns}
          data={nonZeroBalances}
          searchKey="coin"
          searchPlaceholder="Search by asset..."
        />
        {nonZeroBalances.length > 0 && (
          <p className="text-sm text-muted-foreground text-right">
            <span className="font-mono font-medium text-foreground">
              $
              {totalValue.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Header
          title="Spot Balances"
          description="Your current spot asset balances on Hyperliquid"
        />
        <UnifiedDepositModal />
      </div>
      {renderContent()}
    </div>
  );
}
