import "@/styles/globals.css";
import "katex/dist/katex.min.css";
import "@solana/wallet-adapter-react-ui/styles.css";
import type { AppProps } from "next/app";
import ToastWrapper from "@/lib/components/ToastWrapper";
import { SessionProvider } from "next-auth/react";
import { useEffect, useMemo } from "react";
import { Urbanist, Righteous } from 'next/font/google';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl, Cluster } from '@solana/web3.js';
import { VoiceProvider } from "@/lib/components/voice/VoiceContextProvider";

const urbanist = Urbanist({
  subsets: ['latin'],
  variable: '--font-urbanist',
});

const righteous = Righteous({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-righteous',
});

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  useEffect(() => {
    document.title = 'Solana Bot';
  }, []);

  return (
    <main className={`${urbanist.variable} ${righteous.variable}`}>
      <SessionProvider session={session}>
        <VoiceProvider>
          <Component {...pageProps} />
          <ToastWrapper />
        </VoiceProvider>
      </SessionProvider>
    </main>
  );
}