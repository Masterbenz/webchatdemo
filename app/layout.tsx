import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LINE OA Web Chat",
  description: "Simple LINE Official Account web chat demo",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}