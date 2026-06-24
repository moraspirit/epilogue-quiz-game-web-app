import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/siteMetadata";

export const metadata: Metadata = createPageMetadata("Quiz");

export default function QuizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
