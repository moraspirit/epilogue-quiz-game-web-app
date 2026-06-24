import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/siteMetadata";

export const metadata: Metadata = createPageMetadata("Levels");

export default function LevelsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
