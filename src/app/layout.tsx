import type { Metadata } from "next";
import { IBM_Plex_Mono, Noto_Sans_Thai, Space_Grotesk } from "next/font/google";
import "./globals.css";

const bodyFont = Noto_Sans_Thai({
  variable: "--font-body",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
});

const headingFont = Space_Grotesk({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const monoFont = IBM_Plex_Mono({
  variable: "--font-code",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

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
    <html lang="th">
      <body
        className={`${bodyFont.variable} ${headingFont.variable} ${monoFont.variable} min-h-screen bg-background text-foreground antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
