function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function parseYmdPrefix(value: string): { year: number; month: number; day: number } | null {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!year || month < 1 || month > 12 || day < 1 || day > 31) return null;

  return { year, month, day };
}

export function localDateToYmd(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function toDateInputValue(value?: string | null): string {
  if (!value) return '';

  const ymd = parseYmdPrefix(value.trim());
  if (ymd) {
    return `${ymd.year}-${pad2(ymd.month)}-${pad2(ymd.day)}`;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return localDateToYmd(date);
}

export function formatDateVi(value?: string | null): string {
  if (!value) return '-';

  const raw = value.trim();
  if (!raw) return '-';

  const ymd = parseYmdPrefix(raw);
  if (ymd) {
    return `${pad2(ymd.day)}/${pad2(ymd.month)}/${ymd.year}`;
  }

  const slash = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (slash) {
    return `${slash[1]}/${slash[2]}/${slash[3]}`;
  }

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return '-';
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()}`;
}

export function parseDateStringToLocalDate(value: string): Date | null {
  const raw = value.trim();
  if (!raw) return null;

  const ymd = parseYmdPrefix(raw);
  if (ymd) {
    return new Date(ymd.year, ymd.month - 1, ymd.day);
  }

  const slash = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (slash) {
    const day = Number(slash[1]);
    const month = Number(slash[2]);
    const year = Number(slash[3]);
    return new Date(year, month - 1, day);
  }

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}
