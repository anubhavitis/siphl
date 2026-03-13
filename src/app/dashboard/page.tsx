"use client";

import { useAccount } from "wagmi";
import { AlertCircle, Link } from "lucide-react";
import { useCheckUser } from "@/lib/hyperliquid/hooks";
import { useRouter } from "next/navigation";
import { AgentDetails } from "@/components/dashboard/agent-details";
import { Portfolio } from "@/components/dashboard/portfolio";
import { RecentOrdersTable } from "@/components/dashboard/recent-orders-table";
import { ErrorBoundary } from "@/components/ui/error-boundary";

export default function DashboardPage() {
  const { address } = useAccount();
  const router = useRouter();

  if (!address) {
    router.push("/");
    return;
  }

  const { data: isUser, isLoading: isCheckingUser } = useCheckUser(address);

  if (!address || isCheckingUser) {
    return (
      <div className="flex items-center justify-center min-h-[320px]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (isUser === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[320px] rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 shadow-inner p-8 border border-gray-200">
        <h1 className="text-2xl font-semibold text-red-600 flex items-center gap-2 mb-4">
          <AlertCircle className="w-6 h-6" /> Hyperliquid Account Not Found
        </h1>
        <p className="text-gray-700 text-base mb-2 text-center">
          It looks like you haven&apos;t created a Hyperliquid account yet.
        </p>
        <p className="text-gray-600 text-sm text-center mb-4">
          To continue, please visit the official site below and create your
          account.
        </p>
        <a
          href="https://app.hyperliquid.xyz/trade"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium shadow hover:bg-emerald-700 transition"
        >
          <Link className="w-4 h-4" /> Go to hyperliquid.xyz
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <AgentDetails />
      <Portfolio address={address} />
      <ErrorBoundary>
        <RecentOrdersTable />
      </ErrorBoundary>
    </div>
  );
}
