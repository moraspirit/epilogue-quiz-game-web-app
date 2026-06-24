import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/siteMetadata";

export const metadata: Metadata = createPageMetadata("Sign In");

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
