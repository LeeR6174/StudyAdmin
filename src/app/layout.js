import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import { AppProvider } from "@/context/AppProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: "StudyAdmin",
  description: "セルフコーチング・ハブ",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "StudyAdmin",
  },
};

export const viewport = {
  themeColor: "#0f1115",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja" className={inter.variable}>
      <body>
        <AppProvider>
          <main style={{ paddingBottom: "var(--nav-height)", minHeight: "100vh" }}>
            {children}
          </main>
          <BottomNav />
        </AppProvider>
      </body>
    </html>
  );
}
