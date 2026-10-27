export function formatNumberBR(val: number | undefined | null): string {
  if (val === undefined || val === null || isNaN(val)) return '0';
  return new Intl.NumberFormat('pt-BR').format(val);
}

export function formatPercentBR(val: number | undefined | null, decimals = 2): string {
  if (val === undefined || val === null || isNaN(val)) return '0,00%';
  return `${val.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}%`;
}

export function formatDeltaNumberBR(val: number | undefined | null): string {
  if (val === undefined || val === null || isNaN(val)) return '0';
  const prefix = val > 0 ? '+' : '';
  return `${prefix}${new Intl.NumberFormat('pt-BR').format(val)}`;
}

export function formatDeltaPercentBR(val: number | undefined | null, decimals = 2): string {
  if (val === undefined || val === null || isNaN(val)) return '0,00 p.p.';
  const prefix = val > 0 ? '+' : '';
  const formatted = val.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${prefix}${formatted} p.p.`;
}
