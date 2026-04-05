import type { Metadata, Viewport } from "next";
import { Outfit, Inter, JetBrains_Mono } from "next/font/google";
import PwaRegistrar from "@/components/PwaRegistrar";
import "@/styles/globals.css";
import "@/styles/animations.css";

const outfit = Outfit({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "700"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0F0F1A",
};

export const metadata: Metadata = {
  title: "QubeSolve — Rubik's Cube Solver",
  description:
    "Scan your Rubik's cube with your camera and get step-by-step animated instructions to solve it. A fun, kid-friendly progressive web app.",
  keywords: [
    "rubiks cube solver",
    "rubik solver",
    "cube solver app",
    "3x3 cube solver",
    "rubiks cube camera",
  ],
  authors: [{ name: "QubeSolve" }],
  openGraph: {
    title: "QubeSolve — Rubik's Cube Solver",
    description:
      "Scan your cube, get step-by-step animated solve instructions.",
    type: "website",
    locale: "en_US",
    siteName: "QubeSolve",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "QubeSolve",
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body suppressHydrationWarning>
        <PwaRegistrar />
        {children}
      </body>
    </html>
  );
}
