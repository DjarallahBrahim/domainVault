import type { Metadata } from "next";
import { JetBrains_Mono, Inter, Sora } from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { MotionProvider } from "@/components/providers/motion-provider";
import { Toaster } from "sonner";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "DNfly.io",
    template: "%s — DNfly.io",
  },
  description: "Professional domain portfolio management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${jetbrainsMono.variable} ${inter.variable} ${sora.variable}`}
    >
      <body className="min-h-screen bg-bg-primary text-text-primary antialiased">
        <QueryProvider>
          <ThemeProvider>
            <MotionProvider>{children}</MotionProvider>
          </ThemeProvider>
        </QueryProvider>
        <Toaster richColors closeButton />
      </body>
    </html>
  );
}
