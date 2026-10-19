import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { SCHOOL } from "@/lib/school-config";
import { ToastProvider } from "@/components/ui/Toast";
import { ThemeProvider } from "@/components/marketing/ThemeProvider";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${SCHOOL.name} | ${SCHOOL.motto}`,
    template: `%s | ${SCHOOL.shortName}`,
  },
  description: `${SCHOOL.name} — ${SCHOOL.tagline}. Online admissions, results, parent & staff portals.`,
  icons: {
    icon: "/logo-icon.png",
    apple: "/logo-icon.png",
  },
  openGraph: {
    title: SCHOOL.name,
    description: SCHOOL.tagline,
    siteName: SCHOOL.name,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("kms-theme");if(t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches)){document.documentElement.classList.add("dark")}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="font-sans bg-paper text-ink dark:bg-[#0a1524] dark:text-[#e8eef5] transition-colors">
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
