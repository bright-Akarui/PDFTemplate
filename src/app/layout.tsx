import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { FileCode } from "lucide-react";
import { TemplatesProvider } from "@/components/providers/TemplatesProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "TemplateFlow",
  description: "Visually design and generate HTML templates.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-body antialiased",
          inter.variable
        )}
      >
        <TemplatesProvider>
          <div className="flex flex-col min-h-screen">
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="container flex h-14 items-center">
                <Link href="/" className="flex items-center gap-2 font-bold text-lg">
                  <FileCode className="h-6 w-6 text-primary" />
                  <span className="text-primary">Template</span><span className="font-light">Flow</span>
                </Link>
                <nav className="ml-auto flex items-center space-x-6 text-sm font-medium">
                  <Link href="/" className="transition-colors hover:text-primary">All Templates</Link>
                  <Link href="/editor/new" className="transition-colors hover:text-primary">New Template</Link>
                </nav>
              </div>
            </header>
            <main className="flex-1">{children}</main>
          </div>
          <Toaster />
        </TemplatesProvider>
      </body>
    </html>
  );
}
