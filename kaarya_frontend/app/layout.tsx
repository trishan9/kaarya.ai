import type { Metadata } from "next";
import { Geist_Mono, Space_Grotesk } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import ToastProvider from "@/components/providers/toast-provider";

const generalSans = localFont({
  src: [
    {
      path: "../assets/fonts/GeneralSans-Extralight.otf",
      weight: "200",
      style: "normal",
    },
    {
      path: "../assets/fonts/GeneralSans-Light.otf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../assets/fonts/GeneralSans-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../assets/fonts/GeneralSans-Medium.otf",
      weight: "500",
      style: "normal",
    },
  ],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-grotesk",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KaaryaAI | AI-Powered Career, and Talent Management System",
  description:
    "AI-Powered Career, and Talent Management System for Colleges in Nepal",
};

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${generalSans.className} ${spaceGrotesk.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        {modal}
        <ToastProvider />
      </body>
    </html>
  );
}
