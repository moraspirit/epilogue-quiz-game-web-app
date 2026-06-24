import type { Metadata } from "next";

export const siteName = "Epilogue Quiz";

export const siteDescription =
  "Live gamified quiz competition by Moraspirit. Answer in order, climb the leaderboard, and win.";

export function createPageMetadata(
  title: string,
  description: string = siteDescription
): Metadata {
  return {
    title,
    description,
  };
}
