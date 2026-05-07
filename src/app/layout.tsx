import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FilaAI — Agendamento Inteligente",
  description: "Sistema inteligente de agendamento e controle de serviços para o seu comércio. Gerencie agendamentos, profissionais e serviços de forma simples.",
  keywords: ["agendamento", "barbearia", "serviços", "gestão", "comércio"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
