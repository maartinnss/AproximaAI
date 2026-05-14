import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "AproximaAI — Agendamento Inteligente",
  description: "AproximaAI conecta seu negócio ao WhatsApp com IA. Gerencie agendamentos, profissionais e serviços — e aproxime cada cliente do seu atendimento.",
  keywords: ["agendamento", "barbearia", "serviços", "gestão", "comércio"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body suppressHydrationWarning>
        {children}
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  );
}
