type Dose = {
  time: string;
  qty: number;
  days: string | null; // JSON string "[0,1]" or null
};

export function calculateTrueSupply(currentStock: number, doses: Dose[]) {
  if (currentStock <= 0) return 0;
  // If no doses are set, we can't calculate duration, return a high number or 0
  if (!doses || doses.length === 0) return 999; 

  let simulatedStock = currentStock;
  let daysPassed = 0;
  const MAX_LOOKAHEAD = 365; // Stop calculating after a year

  while (simulatedStock > 0 && daysPassed < MAX_LOOKAHEAD) {
    const checkDate = new Date();
    checkDate.setDate(checkDate.getDate() + daysPassed);
    const dayOfWeek = checkDate.getDay(); // 0 = Sun, 1 = Mon...

    for (const dose of doses) {
      let isActiveToday = false;
      
      if (!dose.days) {
        isActiveToday = true; // Daily
      } else {
        const activeDays = JSON.parse(dose.days);
        if (Array.isArray(activeDays) && activeDays.includes(dayOfWeek)) {
          isActiveToday = true;
        }
      }

      if (isActiveToday) {
        simulatedStock -= dose.qty;
      }
    }

    if (simulatedStock > 0) {
      daysPassed++;
    }
  }

  return daysPassed;
}