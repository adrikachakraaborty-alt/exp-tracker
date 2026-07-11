import type { Metadata, Viewport } from "next";
import "./globals.css";
import ServiceWorker from "./ServiceWorker";

export const metadata: Metadata = { title: "Ledgerly", description: "Your personal expense workspace", manifest: "/manifest.webmanifest", appleWebApp: { capable: true, statusBarStyle: "default", title: "Ledgerly" } };
export const viewport: Viewport = { themeColor: "#23594c", width: "device-width", initialScale: 1 };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body><ServiceWorker />{children}</body></html>; }
