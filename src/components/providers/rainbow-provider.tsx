import "@rainbow-me/rainbowkit/styles.css";

import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { arbitrum } from "wagmi/chains";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

const config = getDefaultConfig({
  appName: "My RainbowKit App",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "blah blah",
  chains: [arbitrum],
  ssr: true, // If your dApp uses server side rendering (SSR)
});

const queryClient = new QueryClient();
export default function RainbowProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

// const queryClient = new QueryClient({
//   defaultOptions: {
//     queries: {
//       refetchOnWindowFocus: false,
//     },
//   },
// });

// // Create connectors at module scope to prevent re-creation on every render
// const connectors = connectorsForWallets(
//   [
//     {
//       groupName: "Recommended",
//       wallets: [metaMaskWallet, rabbyWallet, walletConnectWallet],
//     },
//   ],
//   {
//     appName: "SIPHL - Hyperliquid SIP Platform",
//     projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "blah blah",
//   }
// );

// // Create config at module scope to prevent re-initialization of Wagmi on every render
// const config = createConfig({
//   chains: [arbitrum],
//   connectors,
//   transports: {
//     [arbitrum.id]: http(),
//   },
//   // Disable multiInjectedProviderDiscovery to avoid conflicts between MetaMask/Rabby
//   multiInjectedProviderDiscovery: false,
//   // Enable SSR mode for proper hydration
//   ssr: true,
// });

// export function RainbowProvider({ children }: { children: React.ReactNode }) {
//   return (
//     <QueryClientProvider client={queryClient}>
//       <WagmiProvider config={config} reconnectOnMount={true}>
//         <RainbowKitProvider>{children}</RainbowKitProvider>
//       </WagmiProvider>
//     </QueryClientProvider>
//   );
// }
