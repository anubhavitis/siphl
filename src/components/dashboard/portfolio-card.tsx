"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, Pause, Play } from "lucide-react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export interface PortfolioItem {
  coin: string;
  isUsdc: boolean;
  balance: number | null;
  entryNtl: number | null;
  currentPrice: number | null;
  currentValue: number | null;
  avgBuyPrice: number | null;
  pnlPercent: number | null;
  sip: {
    id: string;
    monthlyAmount: number;
    status: string;
  } | null;
}

interface PortfolioCardProps {
  item: PortfolioItem;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onCancel: (id: string) => void;
  isPausing: boolean;
  isResuming: boolean;
  isCancelling: boolean;
}

function formatUsd(value: number, maxDecimals = 2) {
  return (
    "$" +
    value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: maxDecimals,
    })
  );
}

function TradeLink({
  coin,
  children,
}: {
  coin: string;
  children: React.ReactNode;
}) {
  if (coin === "USDC") return <>{children}</>;
  const uiName = coin.startsWith("U") ? coin.slice(1) : coin;
  return (
    <a
      href={`https://app.hyperliquid.xyz/trade/${uiName}/USDC`}
      target="_blank"
      rel="noopener noreferrer"
      className="hover:underline"
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </a>
  );
}

function PnlBadge({ pnl }: { pnl: number }) {
  const isPositive = pnl > 0;
  const isNegative = pnl < 0;
  return (
    <span
      className={`text-sm font-mono font-medium ${
        isPositive
          ? "text-green-600 dark:text-green-400"
          : isNegative
            ? "text-red-600 dark:text-red-400"
            : "text-muted-foreground"
      }`}
    >
      {isPositive ? "+" : ""}
      {pnl.toFixed(2)}%
    </span>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-mono">{value}</span>
    </div>
  );
}

export function PortfolioCard({
  item,
  onPause,
  onResume,
  onCancel,
  isPausing,
  isResuming,
  isCancelling,
}: PortfolioCardProps) {
  const {
    coin,
    isUsdc,
    balance,
    currentValue,
    currentPrice,
    avgBuyPrice,
    entryNtl,
    pnlPercent,
    sip,
  } = item;

  if (isUsdc) {
    return (
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <span className="font-medium">USDC</span>
          <span className="font-mono text-lg">
            {balance !== null ? formatUsd(balance) : "--"}
          </span>
        </CardContent>
      </Card>
    );
  }

  const valueColor =
    pnlPercent !== null && pnlPercent > 0
      ? "text-green-600 dark:text-green-400"
      : pnlPercent !== null && pnlPercent < 0
        ? "text-red-600 dark:text-red-400"
        : "";

  return (
    <Card>
      <Accordion type="single" collapsible>
        <AccordionItem value={coin} className="border-b-0">
          <CardContent className="p-4 pb-0">
            <AccordionTrigger className="py-0 hover:no-underline">
              <div className="flex items-center justify-between w-full pr-2">
                <div className="flex items-center gap-3">
                  <TradeLink coin={coin}>
                    <span className="font-medium">{coin}</span>
                  </TradeLink>
                  {pnlPercent !== null && <PnlBadge pnl={pnlPercent} />}
                </div>
                <span className="text-sm font-mono text-muted-foreground">
                  {avgBuyPrice !== null ? formatUsd(avgBuyPrice, 6) : "--"}
                </span>
              </div>
            </AccordionTrigger>
          </CardContent>

          <AccordionContent>
            <div className="px-4 pb-4 space-y-3">
              <div
                className={`text-2xl font-mono font-semibold ${valueColor}`}
              >
                {currentValue !== null ? formatUsd(currentValue) : "--"}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <DetailRow
                  label="Price"
                  value={
                    currentPrice !== null ? formatUsd(currentPrice, 6) : "--"
                  }
                />
                <DetailRow
                  label="Balance"
                  value={
                    balance !== null
                      ? balance.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 8,
                        })
                      : "--"
                  }
                />
                <DetailRow
                  label="Invested"
                  value={
                    entryNtl !== null && entryNtl > 0
                      ? formatUsd(entryNtl)
                      : "--"
                  }
                />
                <DetailRow
                  label="Avg Buy"
                  value={
                    avgBuyPrice !== null ? formatUsd(avgBuyPrice, 6) : "--"
                  }
                />
              </div>

              {sip && (
                <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm text-muted-foreground truncate">
                      {sip.monthlyAmount} USDC/mo
                    </span>
                    <Badge
                      variant={
                        sip.status === "active" ? "default" : "secondary"
                      }
                    >
                      {sip.status === "active" ? "Active" : "Paused"}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    {sip.status === "active" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onPause(sip.id)}
                        disabled={isPausing}
                      >
                        {isPausing ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Pause className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    )}
                    {sip.status === "paused" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onResume(sip.id)}
                        disabled={isResuming}
                      >
                        {isResuming ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Play className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          disabled={isCancelling}
                        >
                          {isCancelling ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Cancel SIP?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to cancel this SIP for {coin}?
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>No, keep it</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onCancel(sip.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Yes, cancel SIP
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}
