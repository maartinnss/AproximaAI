import { hash } from "@node-rs/argon2";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/server/db/client";
import { jsonError } from "@/server/lib/api-helpers";
import { checkRateLimit } from "@/server/lib/rate-limit";
import { registroSchema } from "@/server/validators/registro.schema";
import type { Prisma } from "@prisma/client";

class EmailDuplicado extends Error {}

function slugify(str: string): string {
  return str
    .normalize("NFD")
    .replace(/\p{Mn}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 63);
}

async function uniqueSlug(nome: string, tx: Prisma.TransactionClient): Promise<string> {
  const base = slugify(nome) || "estabelecimento";
  for (let i = 0; i < 3; i++) {
    const candidate =
      i === 0
        ? base
        : `${base.substring(0, 57)}-${Math.random().toString(36).substring(2, 7)}`;
    const taken = await tx.estabelecimento.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!taken) return candidate;
  }
  return `${base.substring(0, 50)}-${Date.now().toString(36)}`;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = await checkRateLimit(`registro:${ip}`, 5, 60_000);
  if (!rl.ok) {
    return jsonError(429, "rate_limit", "Muitas tentativas. Aguarde 1 minuto.");
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return jsonError(400, "invalid_json", "Body precisa ser JSON válido");
  }

  const parsed = registroSchema.safeParse(raw);
  if (!parsed.success) {
    const msg = parsed.error.issues
      .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("; ");
    return jsonError(400, "validation_error", msg);
  }

  const { nomeGestor, email, senha, nomeEstabelecimento, categoria, telefone, endereco } =
    parsed.data;

  const senhaHash = await hash(senha);
  const trialFim = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  try {
    await db.$transaction(async (tx) => {
      const emailTaken = await tx.usuarioGestor.findUnique({ where: { email }, select: { id: true } });
      if (emailTaken) throw new EmailDuplicado();

      const slug = await uniqueSlug(nomeEstabelecimento, tx);

      const est = await tx.estabelecimento.create({
        data: {
          slug,
          evolutionInstanceName: slug,
          nome: nomeEstabelecimento,
          descricao: "",
          endereco,
          telefone,
          email,
          categoria,
          horarioFuncionamento: {
            abertura: "09:00",
            fechamento: "18:00",
            diasSemana: [1, 2, 3, 4, 5, 6],
          },
        },
      });

      await tx.usuarioGestor.create({
        data: {
          estabelecimentoId: est.id,
          nome: nomeGestor,
          email,
          senhaHash,
          role: "owner",
          emailVerificadoEm: new Date(),
        },
      });

      await tx.assinatura.create({
        data: {
          estabelecimentoId: est.id,
          plano: "trial",
          status: "trialing",
          periodoInicio: new Date(),
          periodoFim: trialFim,
          trialFim,
        },
      });
    });
  } catch (err) {
    if (err instanceof EmailDuplicado) {
      return jsonError(409, "email_duplicado", "E-mail já cadastrado");
    }
    throw err;
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
