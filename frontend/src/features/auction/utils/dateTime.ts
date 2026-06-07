export function getNextOccurrenceISO(timeStr: string | null | undefined): string | null {
  if (!timeStr || timeStr === 'now') return null;

  if (timeStr.includes('T')) return timeStr;

  const isPm = timeStr.includes('pm');
  let hour = parseInt(timeStr);

  if (isPm && hour !== 12) hour += 12;
  if (!isPm && hour === 12) hour = 0;

  const date = new Date();
  date.setHours(hour, 0, 0, 0);

  if (date.getTime() < new Date().getTime()) {
    date.setDate(date.getDate() + 1);
  }

  return date.toISOString();
}
