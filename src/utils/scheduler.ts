import { isSameDay, isAfter, set } from 'date-fns';

type Dose = {
  id: number;
  time: string;
  qty: number;
  days: string | null;
};

type Log = {
  action: 'TAKEN' | 'SKIPPED' | 'LOST';
  timestamp: Date;
  doseId: number | null;
};

export function getNextDoseLabel(doses: Dose[], logs: Log[]) {
  const now = new Date();
  
  const todaysLogs = logs.filter(l => 
    l.action !== 'LOST' && isSameDay(new Date(l.timestamp), now)
  );

  const sortedDoses = [...doses].sort((a, b) => a.time.localeCompare(b.time));

  const dayOfWeek = now.getDay();
  const todaysDoses = sortedDoses.filter(d => {
    if (!d.days) return true; 
    return JSON.parse(d.days).includes(dayOfWeek);
  });

  const dosesTakenCount = todaysLogs.length;
  
  // A. All done today
  if (dosesTakenCount >= todaysDoses.length) {
    if (sortedDoses.length > 0) {
       return { 
         text: `Next: ${sortedDoses[0].qty} Pill(s)`, 
         subtext: `Tomorrow ${sortedDoses[0].time}`, 
         isOverdue: false, 
         isTomorrow: true,
         nextDose: sortedDoses[0]
       };
    }
    return { text: "All Done", subtext: "Relax", isOverdue: false, isTomorrow: false, nextDose: null };
  }

  // B. Next Dose Logic
  const nextDose = todaysDoses[dosesTakenCount];
  const [hours, minutes] = nextDose.time.split(':').map(Number);
  const doseDate = set(now, { hours, minutes, seconds: 0, milliseconds: 0 });

  const isOverdue = isAfter(now, doseDate);

  return {
    text: isOverdue ? `Take ${nextDose.qty} (Overdue)` : `Take ${nextDose.qty}`,
    subtext: isOverdue ? `${nextDose.time} Today` : `at ${nextDose.time}`,
    isOverdue: isOverdue,
    isTomorrow: false,
    nextDose: nextDose
  };
}