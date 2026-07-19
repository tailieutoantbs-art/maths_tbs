import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import { ToastProvider } from '@/components/ToastProvider';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { ThemeProvider } from "@/components/ThemeProvider";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Hệ thống Toán TBS",
  description: "Không gian học tập và khảo thí tương tác Tổ Toán TBS",
};

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel="stylesheet" type="text/css" href="https://tikzjax.com/v1/fonts.css" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <ToastProvider>
              {children}
            </ToastProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}