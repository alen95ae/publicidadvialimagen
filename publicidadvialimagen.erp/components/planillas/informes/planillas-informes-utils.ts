export function periodoToRange(periodo: number): { fechaInicial: string; fechaFinal: string } {
  // periodo: YYYYMM
  const s = String(periodo || "")
  const year = parseInt(s.slice(0, 4) || "0", 10)
  const month = parseInt(s.slice(4, 6) || "1", 10) // 1-12
  const start = new Date(Date.UTC(year, Math.max(0, month - 1), 1))
  const end = new Date(Date.UTC(year, Math.max(0, month), 0)) // day 0 of next month = last day of month

  const toISO = (d: Date) => d.toISOString().slice(0, 10)
  return { fechaInicial: toISO(start), fechaFinal: toISO(end) }
}


