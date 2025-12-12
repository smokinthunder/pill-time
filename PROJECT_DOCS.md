# 💊 Grandpa's Med Manager - Project Documentation

## 1. Project Overview

**Goal:** A medication management app designed specifically for seniors (90+ years old).
**Philosophy:** "Smart but Simple." The app handles complex math (supply duration, next dose scheduling) internally but presents simple, high-contrast, large-text decisions to the user.
**Platform:** React Native (Expo)
**Target:** iOS & Android

---

## 2. Tech Stack & Architecture

### Core Technologies

- **Framework:** React Native (Expo SDK 50+)
- **Routing:** Expo Router (File-based routing)
- **Language:** TypeScript
- **Styling:** NativeWind (Tailwind CSS for React Native)
- **Database:** SQLite (via `expo-sqlite`)
- **ORM:** Drizzle ORM (Type-safe database interactions)
- **Icons:** Lucide React Native
- **Fonts:** Plus Jakarta Sans (Google Fonts)

### Directory Structure (Clean Architecture)

```text
/app
  ├── _layout.tsx         # Root Layout (Providers, Database Init, Splash Screen)
  ├── add.tsx             # Add Medicine Modal
  ├── settings.tsx        # Settings Modal
  └── (tabs)              # Bottom Tab Navigation
      ├── _layout.tsx     # Tab Configuration
      ├── index.tsx       # Dashboard (Home)
      ├── purchases.tsx   # Refill Price Comparison
      └── history.tsx     # Log History
/src
  ├── components          # Reusable UI elements
  │   ├── PillCard.tsx    # The main dashboard card (Smart Button logic)
  │   └── PopUpCard.tsx   # Context-aware Modal (Actions)
  ├── core
  │   └── database        # Database Logic
  │       ├── client.ts   # Drizzle Client Setup
  │       ├── schema.ts   # Table Definitions
  │       ├── seed.ts     # Test Data Generator
  │       └── initialize.ts # SQL Table Creation Script
  ├── hooks               # Custom React Hooks (useColorScheme)
  └── utils               # Pure Logic Functions
      ├── calculator.ts   # Supply Duration Simulation
      └── scheduler.ts    # Next Dose Priority Logic
```

---

## 3\. Database Schema

We use **Drizzle ORM** with SQLite. The database is relational.

### A. Medications (`medications`)

Stores the profile of the pill (Inventory).

- `id`: Primary Key
- `name`: Text (e.g., "Metformin")
- `currentStock`: Real (Number of pills left)
- `totalStockLevel`: Real (Full bottle size)
- `unit`: Text ("mg", "ml", "nos")

### B. Doses (`doses`)

**One Medicine -\> Many Doses.** Stores the _rules_.

- `medicationId`: Foreign Key (Cascade Delete)
- `time`: Text (24h format "08:00")
- `qty`: Real (Amount to take at this time)
- `days`: JSON String or Null (`[0, 6]` = Sun/Sat, `null` = Daily)

### C. Logs (`logs`)

**One Medicine -\> Many Logs.** Stores the _history_.

- `medicationId`: Foreign Key
- `doseId`: Foreign Key (Nullable, for "Lost" pills)
- `action`: Enum ("TAKEN", "SKIPPED", "LOST")
- `timestamp`: Integer (Milliseconds)

### D. App Settings (`app_settings`)

Stores user preferences.

- `showDaysSupply`: Boolean (Show "15 Days" vs "30 Pills")
- `refillThresholdDays`: Integer (When to alert)

---

## 4\. Key Logic & Algorithms

### A. Supply Simulation (`src/utils/calculator.ts`)

Instead of simple division (Total / Daily Avg), we run a **Day-by-Day Simulation**.

1.  Loop through future dates (Today + 1, Today + 2...).
2.  Check which doses apply on that specific day (Weekly vs Daily).
3.  Subtract from stock.
4.  Stop when stock \<= 0.
    _Result:_ Accurate "Days Left" count even for complex rotating schedules.

### B. Smart Scheduler (`src/utils/scheduler.ts`)

Determines the label of the "Take Dose" button.
**Priority Logic:**

1.  **Overdue:** Is there a dose from earlier today that wasn't logged? -\> _Show Red "Overdue"._
2.  **Due Now:** Is there a dose scheduled for later today? -\> _Show Green "Take X"._
3.  **Finished:** Are all doses for today logged? -\> _Show Blue "Next: Tomorrow 8 AM"._

---

## 5\. UI & Accessibility Themes

### Design Rules

- **No "Invisible" Gestures:** Avoid double taps.
- **Actionable Context:** Long press the _Card_ for Admin tasks, Long press the _Button_ for Dose tasks.
- **High Contrast:** Dark text on Light background (and vice versa).

### Color System (Functional)

| Color      | Meaning              | Used For                                |
| :--------- | :------------------- | :-------------------------------------- |
| **Green**  | Positive / Go        | Taking a dose, Best Price badge.        |
| **Red**    | Urgent / Danger      | Overdue dose, Low stock, Delete action. |
| **Blue**   | Informational / Wait | Future doses (Tomorrow), Edit details.  |
| **Amber**  | Warning              | Skip dose.                              |
| **Orange** | Alert                | Lost pill.                              |

---

## 6\. Completed Features (Current Status)

### ✅ Dashboard (Home)

- Lists all medicines.
- **Smart Button:** Shows dynamic state (Overdue/Take/Tomorrow).
- **Supply Bar:** visualizes stock level.
- **Context Menus:**
  - _Card Long Press:_ Refill, Edit, Delete.
  - _Button Long Press:_ Skip, Report Lost.

### ✅ History Tab

- SectionList grouped by Date (Today, Yesterday, etc.).
- Visual icons for Taken/Skipped/Lost.
- Ability to delete incorrect logs.

### ✅ Purchases Tab

- Lists refill history.
- **Price Comparison Engine:** Automatically highlights the "Best Rate" (lowest price per pill) with a green badge.
- Groups history by Medicine name.

### ✅ Add Medicine (Modal)

- Senior-friendly inputs (Large text).
- Visual Day Selector (S M T W T F S).
- Dose Time Picker (Clock interface).
- Inventory setup.

### ✅ Settings

- Toggle: Display "Days Supply" vs "Pill Count".
- Set Low Stock Threshold.
- Data persistence via SQLite.

### ✅ Infrastructure

- Database initialization script (Auto-creates tables).
- Seeding script (Generates test scenarios).
- Dark Mode support (Full Tailwind `dark:` classes).

---

## 7\. Todo List (Roadmap)

### 🚨 Critical

- [ ] **Notifications:** Integrate `expo-notifications` to trigger local push alerts based on the `doses` table times.
- [ ] **Refill Input Form:** A screen to actually add a new purchase (Currently using seed data).
- [ ] **Edit Medicine Screen:** A screen to modify existing dosages or names (The "Edit" button currently just logs to console).

### 🚀 Enhancements

- [ ] **Graphs:** A simple chart in History showing adherence %.
- [ ] **Export:** PDF export of history for the doctor.
- [ ] **Pharmacy Map:** Integrate maps to show where the "Best Price" pharmacy is located.

---

## 8\. Workflow & Data Flow

1.  **App Start:** `_layout.tsx` runs `initializeDatabase()` -\> Tables created.
2.  **User Action:** User taps "Take Dose".
3.  **Transaction:** `handleTakePill` runs a DB Transaction:
    - Decrement `medications.currentStock`.
    - Insert row into `logs`.
4.  **Refresh:** `useFocusEffect` triggers `loadData()`.
5.  **Re-Calculation:**
    - `calculateTrueSupply` runs with new stock.
    - `getNextDoseLabel` runs with new logs.
6.  **UI Update:** The React state updates, changing the button from Green ("Take") to Blue ("Tomorrow").

<!-- end list -->

```

```
