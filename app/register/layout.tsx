import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/siteMetadata";

export const metadata: Metadata = createPageMetadata("Register");

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
