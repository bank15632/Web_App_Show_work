import type { Metadata, Viewport } from "next";
import { Prompt } from "next/font/google";

import "./globals.css";

const prompt = Prompt({
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-body-ui",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "Studio Client Rooms",
    template: "%s | Studio Client Rooms",
  },
  description:
    "Private-by-link client portal for interior design presentations, revisions, drawings, and timelines.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={prompt.variable}>
      <body
        className="min-h-screen bg-background font-sans text-foreground antialiased"
      >
        {children}
      </body>
    </html>
  );
}
