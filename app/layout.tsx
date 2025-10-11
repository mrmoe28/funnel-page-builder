import "../styles/globals.css";
import React from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/navbar";
import { FunnelHistorySidebar } from "@/components/FunnelHistorySidebar";
import { LayoutWrapper } from "@/components/LayoutWrapper";

export const metadata = {
  title: "Funnel Page Builder",
  description:
    "Transform any URL into a beautiful funnel splash page with automated screenshots.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <Navbar />
          <FunnelHistorySidebar />
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
