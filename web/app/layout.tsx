import type { Metadata } from "next";
import { Archivo, Source_Serif_4 } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { noFlashThemeScript } from "@/lib/theme";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Vizor for Advisors",
  description:
    "Vizor gives ASU advisors a single ledger for AI-handled student sessions, tickets, and DARS-grounded reports.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning is scoped to this element only (React doesn't
    // propagate it to children) and is the sanctioned escape hatch for
    // exactly this case: the no-flash script below intentionally sets
    // data-theme on the live DOM before React hydrates, so the server-
    // rendered markup and the first client read are expected to disagree.
    <html
      lang="en"
      suppressHydrationWarning
      className={`${archivo.variable} ${sourceSerif.variable} h-full antialiased`}
    >
      <body
        className="min-h-full flex flex-col bg-paper text-ink font-sans"
        suppressHydrationWarning
      >
        {/* beforeInteractive: Next injects this into <head> and runs it
            before the page becomes interactive, ahead of first paint — a
            plain <script> tag as JSX only executes from the server-rendered
            HTML's own parse, which React's dev overlay flags as a hydration
            hazard even though it happens to work. */}
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: noFlashThemeScript }}
        />
        {children}
      </body>
    </html>
  );
}
