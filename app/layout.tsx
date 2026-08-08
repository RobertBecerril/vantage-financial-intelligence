import type { Metadata } from "next";
import {
  Bricolage_Grotesque,
  Inter,
  Space_Grotesk,
} from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-vantage",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Vantage | Financial Intelligence",
  description:
    "A financial document intelligence platform for analyzing filings, changes, and supporting evidence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${bricolageGrotesque.variable}`}
      >
        {children}
      </body>
    </html>
  );
}