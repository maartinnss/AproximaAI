import "server-only";

/**
 * Helpers de data/hora cientes de IANA timezone, sem depender de lib externa.
 *
 * Estratégia: usar `Intl.DateTimeFormat` para extrair partes em um timezone
 * alvo, e depois reconstruir um `Date` UTC equivalente. Suporta DST porque
 * `Intl` aplica o offset correto para a data específica.
 */

type DateParts = {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  hour: number; // 0-23
  minute: number;
  second: number;
};

const NUM_FMT_CACHE = new Map<string, Intl.DateTimeFormat>();

function getNumericFormatter(timezone: string): Intl.DateTimeFormat {
  let f = NUM_FMT_CACHE.get(timezone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    NUM_FMT_CACHE.set(timezone, f);
  }
  return f;
}

/** Decompõe um Date UTC em partes "do relógio" no timezone alvo. */
export function getZonedParts(at: Date, timezone: string): DateParts {
  const parts = getNumericFormatter(timezone).formatToParts(at);
  const lookup: Record<string, string> = {};
  for (const p of parts) lookup[p.type] = p.value;
  let hour = Number(lookup.hour);
  if (hour === 24) hour = 0;
  return {
    year: Number(lookup.year),
    month: Number(lookup.month),
    day: Number(lookup.day),
    hour,
    minute: Number(lookup.minute),
    second: Number(lookup.second),
  };
}

/**
 * Offset (em minutos) de UTC em relação ao timezone para o instante `at`.
 * Ex: para America/Sao_Paulo retorna -180 (UTC-3).
 *
 * Inclui DST automaticamente baseado no instante.
 */
export function getTimezoneOffsetMinutes(at: Date, timezone: string): number {
  const zoned = getZonedParts(at, timezone);
  const asIfUtc = Date.UTC(
    zoned.year,
    zoned.month - 1,
    zoned.day,
    zoned.hour,
    zoned.minute,
    zoned.second,
  );
  return Math.round((asIfUtc - at.getTime()) / 60_000);
}

/**
 * Converte uma "hora local em timezone" (ex: 2026-05-01 00:00 em SP)
 * para o `Date` UTC correspondente (2026-05-01T03:00:00Z).
 *
 * Itera 1×: estimativa baseada na diferença atual + correção quando o
 * resultado cruza fronteira DST.
 */
export function zonedTimeToUtc(
  parts: Partial<DateParts> & { year: number; month: number; day: number },
  timezone: string,
): Date {
  const full: DateParts = {
    hour: 0,
    minute: 0,
    second: 0,
    ...parts,
  };
  // 1ª aproximação: trata as partes como se fossem UTC.
  const naiveUtc = new Date(
    Date.UTC(full.year, full.month - 1, full.day, full.hour, full.minute, full.second),
  );
  // Quanto offset o tz tem nesse instante.
  const offsetMin = getTimezoneOffsetMinutes(naiveUtc, timezone);
  // Real UTC = naiveUtc - offsetMin (se SP é -180, real UTC = naive + 180min).
  const candidate = new Date(naiveUtc.getTime() - offsetMin * 60_000);
  // Validação: se cruzou DST, recalcula com o offset desse novo instante.
  const offsetMin2 = getTimezoneOffsetMinutes(candidate, timezone);
  if (offsetMin2 === offsetMin) return candidate;
  return new Date(naiveUtc.getTime() - offsetMin2 * 60_000);
}

/**
 * Verifica se uma hora local existe no timezone (não cai em gap de DST).
 *
 * Estratégia: converte as partes para UTC e volta. Se os componentes diferirem,
 * a hora solicitada caiu no "gap" de spring-forward (ex: 02:30 num dia em que
 * os relógios pulam de 02:00 → 03:00 — essa hora não existe).
 */
export function isValidLocalTime(parts: DateParts, timezone: string): boolean {
  const utc = zonedTimeToUtc(parts, timezone);
  const back = getZonedParts(utc, timezone);
  return (
    back.year === parts.year &&
    back.month === parts.month &&
    back.day === parts.day &&
    back.hour === parts.hour &&
    back.minute === parts.minute
  );
}

/** Formata 'YYYY-MM-DD' no timezone alvo. */
export function zonedDateString(at: Date, timezone: string): string {
  const p = getZonedParts(at, timezone);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

/** Adiciona N dias mantendo o mesmo "horário do relógio" no timezone alvo. */
export function addDaysZoned(at: Date, days: number, timezone: string): Date {
  const p = getZonedParts(at, timezone);
  return zonedTimeToUtc(
    {
      year: p.year,
      month: p.month,
      day: p.day + days,
      hour: p.hour,
      minute: p.minute,
      second: p.second,
    },
    timezone,
  );
}

/** UTC do instante "00:00:00 do 1º dia do mês X no timezone alvo". */
export function startOfMonthZoned(at: Date, timezone: string): Date {
  const p = getZonedParts(at, timezone);
  return zonedTimeToUtc({ year: p.year, month: p.month, day: 1 }, timezone);
}

/** UTC do instante "00:00:00 do 1º dia do próximo mês no timezone alvo". */
export function startOfNextMonthZoned(at: Date, timezone: string): Date {
  const p = getZonedParts(at, timezone);
  const nextMonth = p.month === 12 ? 1 : p.month + 1;
  const nextYear = p.month === 12 ? p.year + 1 : p.year;
  return zonedTimeToUtc({ year: nextYear, month: nextMonth, day: 1 }, timezone);
}

/** UTC do instante "00:00:00 do 1º dia do mês anterior no timezone alvo". */
export function startOfPreviousMonthZoned(at: Date, timezone: string): Date {
  const p = getZonedParts(at, timezone);
  const prevMonth = p.month === 1 ? 12 : p.month - 1;
  const prevYear = p.month === 1 ? p.year - 1 : p.year;
  return zonedTimeToUtc({ year: prevYear, month: prevMonth, day: 1 }, timezone);
}

/** UTC do instante "00:00:00 da meia-noite do dia local de `at` no timezone alvo". */
export function startOfDayZoned(at: Date, timezone: string): Date {
  const p = getZonedParts(at, timezone);
  return zonedTimeToUtc({ year: p.year, month: p.month, day: p.day }, timezone);
}

/** Índice (0-6, dom..sáb) do dia da semana no timezone alvo. */
export function dayOfWeekZoned(at: Date, timezone: string): number {
  const p = getZonedParts(at, timezone);
  // Constrói um Date "real" baseado nas partes locais e pega weekday em UTC.
  return new Date(
    Date.UTC(p.year, p.month - 1, p.day, 12),
  ).getUTCDay();
}

export type HorarioFuncionamento = {
  abertura: string; // "HH:mm"
  fechamento: string; // "HH:mm"
  diasSemana: number[]; // 0-6 (dom..sáb)
};

export type HorarioCheckResult =
  | { ok: true }
  | { ok: false; reason: "fora_dos_dias" | "antes_abertura" | "apos_fechamento" };

function parseHHmm(s: string): number {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Verifica se o intervalo `[inicio, fim)` cabe dentro do horário de funcionamento
 * do estabelecimento (no timezone alvo). Retorna motivo específico em caso de
 * falha para o handler escolher o erro de domínio.
 */
export function checarHorarioFuncionamento(
  inicio: Date,
  fim: Date,
  horario: HorarioFuncionamento,
  timezone: string,
): HorarioCheckResult {
  const dow = dayOfWeekZoned(inicio, timezone);
  if (!horario.diasSemana.includes(dow)) return { ok: false, reason: "fora_dos_dias" };

  const inicioParts = getZonedParts(inicio, timezone);
  const fimParts = getZonedParts(fim, timezone);
  const inicioMin = inicioParts.hour * 60 + inicioParts.minute;
  const fimMin = fimParts.hour * 60 + fimParts.minute;
  const aberturaMin = parseHHmm(horario.abertura);
  const fechamentoMin = parseHHmm(horario.fechamento);

  if (inicioMin < aberturaMin) return { ok: false, reason: "antes_abertura" };
  if (fimMin > fechamentoMin) return { ok: false, reason: "apos_fechamento" };
  return { ok: true };
}
