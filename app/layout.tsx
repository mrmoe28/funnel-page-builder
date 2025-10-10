import "../styles/globals.css";
import React from "react";

export const metadata = {
  title: "Funnel Page Builder",
  description:
    "Paste a URL → generate a funnel splash with screenshots & CTA.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
      </body>
    </html>
  );
}
