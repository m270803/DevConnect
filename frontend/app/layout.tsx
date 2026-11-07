import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SkillConnect | Find Your Perfect Professional",
  description:
    "Discover skilled developers, AI engineers, and professionals. Connect, collaborate, and build your next project with SkillConnect.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}