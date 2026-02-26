import { format } from 'date-fns';

export function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(':');
  const d = new Date();
  d.setHours(Number(h), Number(m), 0);
  return format(d, 'h:mm a');
}
