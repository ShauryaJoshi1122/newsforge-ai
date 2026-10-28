import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "NewsForge AI — News websites, made fast", description: "Create branded, WordPress-ready news websites from professional templates with AI-assisted customization." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
