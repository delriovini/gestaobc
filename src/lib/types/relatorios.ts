export interface RelatorioStaffRow {
  id?: string;
  ano: number;
  mes: number;
  staff_id: string;
  tickets_geral: number;
  tickets_security: number;
  tickets_otimizacao: number;
  allowlists: number;
  horas_conectadas: number;
  denuncias: number;
  fechado: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface RelatorioStaffComNome extends RelatorioStaffRow {
  nome: string | null;
}

export interface ResumoRelatorio {
  totalTicketsGeral: number;
  totalTicketsSecurity: number;
  totalTicketsOtimizacao: number;
  totalAllowlists: number;
  totalHoras: number;
  totalDenuncias: number;
}

export type RankingRow = RelatorioStaffComNome;

export const MESES: { value: number; label: string }[] = [
  { value: 1, label: "Janeiro" },
  { value: 2, label: "Fevereiro" },
  { value: 3, label: "Março" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Maio" },
  { value: 6, label: "Junho" },
  { value: 7, label: "Julho" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Setembro" },
  { value: 10, label: "Outubro" },
  { value: 11, label: "Novembro" },
  { value: 12, label: "Dezembro" },
];

export function anosDisponiveis(): number[] {
  const anoAtual = new Date().getFullYear();
  return [anoAtual + 2, anoAtual + 1, anoAtual, anoAtual - 1, anoAtual - 2];
}
