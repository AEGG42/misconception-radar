import type { Metadata } from "next";
import type { ReactNode } from "react";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Misconception Radar — See what your class actually misunderstands",
  description:
    "Turn short-answer responses into evidence-backed misconception clusters and a targeted reteach plan.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  openGraph: {
    title: "Misconception Radar",
    description:
      "From a stack of exit tickets to a class-wide misconception map.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
