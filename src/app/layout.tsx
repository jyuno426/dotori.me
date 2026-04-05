import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "도토리 — 자산배분 ETF 포트폴리오 매니저",
  description:
    "포트폴리오 트래커 + 리밸런싱 계산기 + 은퇴 플래너. 한 알씩 모아, 단단한 내일로.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
