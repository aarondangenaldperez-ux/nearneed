import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NearNeed — Find help nearby",
  description: "Discover local services, share what you need, and connect with independent providers in your community.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
