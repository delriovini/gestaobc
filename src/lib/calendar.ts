export interface CalendarDay {
  date: Date | null;
}

/**
 * Gera array de dias do mês para exibição em calendário (7 colunas fixas).
 * Preenche dias vazios antes do primeiro dia e completa a última linha.
 *
 * @param month - Mês (1-12)
 * @param year - Ano
 * @returns Array com { date: Date | null } - null para células vazias
 */
export function generateCalendarDays(month: number, year: number): CalendarDay[] {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const startWeekday = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const cells: CalendarDay[] = [];

  for (let i = 0; i < startWeekday; i++) {
    cells.push({ date: null });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month - 1, d) });
  }

  const remainder = cells.length % 7;
  if (remainder > 0) {
    for (let i = 0; i < 7 - remainder; i++) {
      cells.push({ date: null });
    }
  }

  return cells;
}

/**
 * Gera array de dias do mês para exibição em calendário.
 * Inclui dias vazios (null) no início para alinhar o dia 1 com o dia da semana.
 *
 * @param month - Mês (1-12)
 * @param year - Ano
 * @param options.padEnd - Se true, preenche com null até completar múltiplo de 7 (padrão: true)
 * @returns Array onde null = célula vazia, number = dia do mês (1-31)
 */
export function getMonthDays(
  month: number,
  year: number,
  options?: { padEnd?: boolean }
): (number | null)[] {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const startWeekday = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const cells: (number | null)[] = [];

  // Dias vazios no início para alinhar com a semana
  for (let i = 0; i < startWeekday; i++) {
    cells.push(null);
  }

  // Dias do mês
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(d);
  }

  // Opcional: preencher até completar última linha (múltiplo de 7)
  const padEnd = options?.padEnd !== false;
  if (padEnd) {
    const remainder = cells.length % 7;
    if (remainder > 0) {
      for (let i = 0; i < 7 - remainder; i++) {
        cells.push(null);
      }
    }
  }

  return cells;
}
