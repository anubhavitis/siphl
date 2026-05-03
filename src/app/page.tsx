"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Socials } from "@/components/layout/socials";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const { isConnected } = useAccount();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isConnected) {
      router.push("/dashboard");
    }
  }, [mounted, isConnected, router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 sm:p-8">
      <div className="w-full max-w-md flex flex-col items-center gap-6">
        <div className="text-center space-y-3">
          <Image
            className="mx-auto"
            src="/logo.png"
            alt="siphl"
            width={100}
            height={100}
          />
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">
            siphl.xyz
          </h1>
          <p className="text-muted-foreground text-sm">
            Automated SPOT SIPs on{" "}
            <a
              href="https://app.hyperliquid.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground transition-colors"
            >
              HL
            </a>
          </p>
        </div>

        <div className="flex flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-0">
            <div className="flex justify-center">
              <ConnectButton
                accountStatus="avatar"
                chainStatus="icon"
                label="Get started"
              />
            </div>
          </div>
          <div className="flex justify-center">
            <Socials />
          </div>
        </div>
      </div>
    </main>
  );
}
