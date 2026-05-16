import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import "katex/dist/katex.min.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "ScholarAI — Study Smarter",
  description: "AI-powered study assistant for Nigerian university students",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}