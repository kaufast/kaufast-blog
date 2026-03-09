import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://kaufast.com"),
  title: {
    default: "Insights — AI, Automation & Web Development Blog | KAUFAST",
    template: "%s — KAUFAST Insights",
  },
  description:
    "Ideas, guides, and case studies on AI agents, automation, and web development.",
  openGraph: {
    title: "Insights — AI, Automation & Web Development Blog | KAUFAST",
    description:
      "Ideas, guides, and case studies on AI agents, business automation, and cloud infrastructure from the KAUFAST team.",
    url: "https://kaufast.com/insights",
    siteName: "KAUFAST",
    images: [
      {
        url: "/images/og-default.webp",
        width: 1200,
        height: 630,
        alt: "KAUFAST Insights — AI, Automation & Web Development Blog",
      },
    ],
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Insights — AI, Automation & Web Development Blog | KAUFAST",
    description:
      "Ideas, guides, and case studies on AI agents, business automation, and cloud infrastructure.",
    images: ["/images/og-default.webp"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
