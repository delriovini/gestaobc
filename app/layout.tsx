import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gestão BC",
  description: "Aplicação de gestão",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
