import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/siteMetadata";

export const metadata: Metadata = createPageMetadata("Start Quiz");

export default function FrontPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
