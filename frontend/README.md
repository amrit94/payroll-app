# React + Vite Frontend Interface

The frontend provides a premium, touch-optimized admin panel styled with a dark glassmorphic design and featuring oversized target controls (minimum 44x44px) for rapid tablet entry.

---

## 🛠️ Styling & Tech Stack

* **Framework**: React 18+
* **Build System**: Vite
* **Language**: TypeScript
* **Styling**: Tailwind CSS v4 (configured via `@import "tailwindcss"` in `src/index.css`)
* **Typography**: Outfit & Inter Google Fonts (configured in the CSS `@theme` directive)
* **Icons**: `lucide-react`

---

## ⚙️ Configuration & API Integration

The frontend routes API calls to the backend base URL defined in `src/config.ts`.

You can set this dynamically using environment variables or a `.env` file in the frontend folder:

```
VITE_API_BASE_URL=http://localhost:8000
```

*For production deployment, create a `.env.production` file pointing to the AWS EC2 or Supabase FastAPI URL.*

---

## 🚀 Running the Frontend Separately

1. Navigate to the frontend directory:
   ```bash
   cd ~/Desktop/Project_AI/Payroll/frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Run the Vite development server:
   ```bash
   npm run dev
   ```
4. Build the production package (compiles TypeScript and bundles code):
   ```bash
   npm run build
   ```

---

## 🖥️ Modular Administrative Views

The application UI is structured into five distinct administrative sections:

### 1. Dashboard Overview
Displays real-time KPIs for the active month (Net Monthly Payout, Base Hours, Extra Work, Advances) alongside Quick Action cards for hard-locking and document exports.

### 2. Attendance Ledger
A daily timesheet view with automatic `Present` status updates when hours are logged. Integrates an "Add Tag" popover modal to assign flat-rate work bonuses (e.g. Husk Packing, Rice delivery, or custom names).

### 3. Employee Registry
Manage worker credentials, hourly baseline rates, and toggles to active/inactive status.

### 4. Cash Advances
Document cash advances issued to employees in the current cycle. Features an interactive list to track loan records and void erroneous advances.

### 5. Lock & Export
Inspects calculated summary matrices of all registered employees for the active cycle and triggers downloads of Excel sheets (`.xlsx`) or print-ready PDF registers/vouchers (`.pdf`).
