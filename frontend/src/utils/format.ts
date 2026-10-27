export function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateIndo(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  if (!year || !month || !day) return dateStr;

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
  ];
  const mIdx = parseInt(month, 10) - 1;
  return `${parseInt(day, 10)} ${months[mIdx] || month} ${year}`;
}

export function formatFullDateIndo(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function formatMonthYear(monthStr: string): string {
  // input: "2026-10"
  const [year, month] = monthStr.split('-');
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const mIdx = parseInt(month, 10) - 1;
  return `${months[mIdx] || month} ${year}`;
}

export function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function getTodayDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCategoryBadgeColor(category: string, type: 'income' | 'expense'): { bg: string; text: string; dot: string } {
  if (type === 'income') {
    switch (category) {
      case 'Gaji':
        return { bg: '#ecfdf5', text: '#065f46', dot: '#10b981' };
      case 'Uang saku':
        return { bg: '#f0fdf4', text: '#166534', dot: '#22c55e' };
      case 'Freelance':
        return { bg: '#eff6ff', text: '#1e40af', dot: '#3b82f6' };
      case 'Bisnis':
        return { bg: '#f5f3ff', text: '#5b21b6', dot: '#8b5cf6' };
      default:
        return { bg: '#f1f5f9', text: '#334155', dot: '#64748b' };
    }
  } else {
    switch (category) {
      case 'Makanan':
        return { bg: '#fff1f2', text: '#9f1239', dot: '#f43f5e' };
      case 'Transportasi':
        return { bg: '#fff7ed', text: '#9a3412', dot: '#f97316' };
      case 'Pendidikan':
        return { bg: '#eff6ff', text: '#1d4ed8', dot: '#3b82f6' };
      case 'Kebutuhan harian':
        return { bg: '#fefce8', text: '#854d0e', dot: '#eab308' };
      case 'Hiburan':
        return { bg: '#faf5ff', text: '#6b21a8', dot: '#a855f7' };
      case 'Tabungan':
        return { bg: '#ecfdf5', text: '#065f46', dot: '#10b981' };
      default:
        return { bg: '#f8fafc', text: '#475569', dot: '#94a3b8' };
    }
  }
}
