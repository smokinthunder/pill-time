import { db } from "./client";
import { medications, doses, logs, refills } from "./schema";

export const seedDatabase = async () => {
  try {
    console.log("🌱 Starting fresh seed...");

    // 1. CLEAR EXISTING DATA (The "Nuke" option for Dev)
    // We delete logs and doses first because they depend on medications
    await db.delete(logs);
    await db.delete(doses);
    await db.delete(medications);

    console.log("🧹 Old data cleared.");

    // ====================================================
    // SCENARIO 1: Metformin (Complex Schedule - 2x Daily)
    // ====================================================
    const metResult = await db
      .insert(medications)
      .values({
        name: "Metformin",
        description: "Diabetes - Take with food",
        currentStock: 45,
        totalStockLevel: 60,
        unit: "nos",
      })
      .returning({ id: medications.id });

    const metId = metResult[0].id;

    // Schedule: 8 AM and 8 PM
    const metDoses = await db
      .insert(doses)
      .values([
        { medicationId: metId, time: "08:00", qty: 1.0, days: null },
        { medicationId: metId, time: "20:00", qty: 1.0, days: null },
      ])
      .returning({ id: doses.id });

    // Log: Took the Morning Dose (Time: 8:05 AM Today)
    const morningDate = new Date();
    morningDate.setHours(8, 5, 0, 0);

    await db.insert(logs).values({
      medicationId: metId,
      doseId: metDoses[0].id, // Link to morning dose
      action: "TAKEN",
      timestamp: morningDate,
    });

    // ====================================================
    // SCENARIO 2: Lisinopril (Missed Dose Test)
    // ====================================================
    const lisResult = await db
      .insert(medications)
      .values({
        name: "Lisinopril",
        description: "Blood Pressure",
        currentStock: 28,
        totalStockLevel: 30,
        unit: "mg",
      })
      .returning({ id: medications.id });

    const lisId = lisResult[0].id;

    // Schedule: Daily at 7:00 AM
    await db
      .insert(doses)
      .values([{ medicationId: lisId, time: "07:00", qty: 1.0, days: null }]);

    // Log: SKIPPED Yesterday (for history testing)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(7, 30, 0, 0);

    await db.insert(logs).values({
      medicationId: lisId,
      action: "SKIPPED",
      timestamp: yesterday,
    });

    // ====================================================
    // SCENARIO 3: Baby Aspirin (Lost Pill Test)
    // ====================================================
    const aspResult = await db
      .insert(medications)
      .values({
        name: "Baby Aspirin",
        description: "Heart Health",
        currentStock: 3, // Low Stock
        totalStockLevel: 50,
        unit: "mg",
      })
      .returning({ id: medications.id });

    const aspId = aspResult[0].id;

    // Log: REPORTED LOST Today
    await db.insert(logs).values({
      medicationId: aspId,
      doseId: null, // Not tied to a specific schedule
      action: "LOST",
      timestamp: new Date(),
    });

    // ====================================================
    // SCENARIO 5: Refill History (Price Comparison)
    // ====================================================
    // Let's add purchase history for Metformin to compare prices

    // Purchase 1: Expensive (CVS)
    await db.insert(refills).values({
      medicationId: metId, // From previous step
      qty: 30,
      price: 15.0, // $0.50 per pill
      pharmacyName: "CVS Pharmacy",
      refillDate: new Date("2024-10-01"),
    });

    // Purchase 2: Cheap (Walmart) - BEST PRICE
    await db.insert(refills).values({
      medicationId: metId,
      qty: 90,
      price: 27.0, // $0.30 per pill (Best Deal!)
      pharmacyName: "Walmart",
      refillDate: new Date("2024-11-15"),
    });

    // Purchase 3: Moderate (Walgreens)
    await db.insert(refills).values({
      medicationId: metId,
      qty: 30,
      price: 12.0, // $0.40 per pill
      pharmacyName: "Walgreens",
      refillDate: new Date("2024-12-05"),
    });

    console.log("✅ Seeding Complete with Logs!");
  } catch (e) {
    console.error("❌ Seeding Error:", e);
  }
};
