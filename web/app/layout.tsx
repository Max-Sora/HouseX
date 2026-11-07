import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import StoreProvider from "./Store";
import Chat from "./Chat";
import { rules } from "@/lib/rules";
import styles from "./page.module.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "HouseX Pre-Check",
  description: "Pre-check a duplex or triplex plan set against city submittal and zoning rules.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${plexSans.variable} ${plexMono.variable}`}>
        <StoreProvider>
          {children}
          <footer className={styles.footer}>
            <span>Prototype built at the UCI Impact Lab, not legal advice and not a city decision</span>
            <span>Rules checked {rules.checked}. Items marked unverified are leads, not facts</span>
            <span>Structural, mechanical, electrical and plumbing design are left to a licensed plan checker</span>
          </footer>
          <Chat />
        </StoreProvider>
      </body>
    </html>
  );
}
