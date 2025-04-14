import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/auth-provider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FintechToronto - Toronto's Fintech & AI Community",
  description: "Join Toronto's vibrant fintech and AI community. Stay updated with the latest trends, events, and insights.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://fintechtoronto.com'),
  openGraph: {
    type: 'website',
    locale: 'en_CA',
    url: '/',
    title: "FintechToronto.com - Toronto's Fintech & AI Community",
    description: "Your community hub for fintech and AI enthusiasts in Toronto. Stay updated with the latest trends, events, and insights.",
    siteName: 'FintechToronto.com',
  },
  twitter: {
    card: 'summary_large_image',
    title: "FintechToronto.com - Toronto's Fintech & AI Community",
    description: "Your community hub for fintech and AI enthusiasts in Toronto. Stay updated with the latest trends, events, and insights.",
    creator: '@fintechtoronto',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={`${inter.className} min-h-screen bg-background font-sans antialiased`}>
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange={false}
          >
            <div className="flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">
                {children}
              </main>
              <Footer />
            </div>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
