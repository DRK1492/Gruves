import type { Metadata } from "next";
import Link from "next/link";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import "./globals.css";
import BackgroundGeometry from "./components/BackgroundGeometry";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Guitar Tracker",
  description: "Track songs, setlists, notes, and practice resources.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`app-root ${inter.variable} ${ibmPlexMono.variable}`}>
        <BackgroundGeometry
          intensity={3.2}
          density={1.8}
          speed={1.2}
          accentBias={0.7}
          sideFocusWidth={0.3}
        />
        <div className="app-shell">
          <header className="app-header">
            <div className="app-header-inner">
              <Link href="/songs" className="app-brand">
                Guitar Tracker
              </Link>
              <nav className="app-nav">
                <Link href="/songs" className="app-nav-link">
                  <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
                    <path
                      d="M5 6h14M5 12h14M5 18h14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                  Songs
                </Link>
                <Link href="/setlists" className="app-nav-link">
                  <svg viewBox="0 0 24 24" className="icon" aria-hidden="true">
                    <path
                      d="M7 6h10M7 12h10M7 18h6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                  Setlists
                </Link>
              </nav>
            </div>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
