import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NearNeed — A better way to describe what you need",
  description: "NearNeed is developing a request-first local services marketplace in the Philippines. Explore the concept and preview a sample request.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
