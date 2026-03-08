import { differenceInDays, differenceInWeeks, differenceInMonths, format } from 'date-fns';

export function calcAge(birthDate: string | Date | null): string {
  if (!birthDate) return 'N/A';
  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
  const now = new Date();
  const months = differenceInMonths(now, birth);
  if (months >= 2) return `${months} months`;
  const weeks = differenceInWeeks(now, birth);
  if (weeks >= 1) return `${weeks} week${weeks > 1 ? 's' : ''}`;
  const days = differenceInDays(now, birth);
  return `${days} day${days !== 1 ? 's' : ''}`;
}
