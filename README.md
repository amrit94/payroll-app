# Payroll Management Application

A modern, touch-optimized, decoupled payroll management application built as a streamlined operations ledger for a single administrator (SuperAdmin) to log daily attendance variables, configure per-employee base pay structures, allocate standardized extra work tag bonuses, track cash advances, and finalize immutable monthly payouts.

## 🚀 Unified Quickstart

To set up, install dependencies, and launch both the FastAPI backend server and the React Vite frontend developer server simultaneously, run the launcher script from the project root:

```bash
./run_app.sh
```

- **React Web App UI:** [http://localhost:5173](http://localhost:5173) (Touch targets optimized for mobile/tablet screen scaling)
- **FastAPI Backend Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🛠️ System Architecture

The application uses a fully decoupled architecture designed for edge delivery and server isolation:

```
                  [ Mobile / Desktop Browser ]
                    /                       \
                   /                         \
  (Loads the UI Interface)              (Sends Payroll Data / API Requests)
                 /                             \
                ▼                               ▼
       ┌────────────────┐             ┌────────────────────────────────┐
       │     VERCEL     │             │          AWS EC2 SERVER        │
       │                │             │                                │
       │ React+Vite App │             │        FastAPI Backend         │
       └────────────────┘             └───────────────┬────────────────┘
                                                      │
                                                      │ (Secure Connection)
                                                      ▼
                                              ┌────────────────┐
                                              │ SUPABASE CLOUD │
                                              │ (Free Postgres)│
                                              └────────────────┘
```

- **Frontend**: Developed with React 18+, Vite, TypeScript, and Tailwind CSS v4. Configured with oversized touch targets (minimum 44x44 pixels) tailored for error-free administrative entries.
- **Backend**: Built with Python 3.12 and the FastAPI framework. Orchestrates domain calculations and exports.
- **Database**: Relational SQLite container locally (default) or Supabase PostgreSQL remotely. Managed using SQLAlchemy.

---

## 📁 Repository Directory Structure

```
Payroll/
├── backend/                # FastAPI application code
│   ├── app/                # Main package folder
│   │   ├── crud.py         # Data operations and math calculations logic
│   │   ├── database.py     # SQLAlchemy session setup
│   │   ├── main.py         # App routers and database initializations
│   │   ├── models.py       # SQLAlchemy relational database entities
│   │   ├── report_generator.py # Excel/PDF compilers
│   │   └── schemas.py      # Pydantic validation schemas
│   ├── requirements.txt    # Python package dependencies list
│   └── run.sh              # Backend dev server launcher script
├── frontend/               # React Vite TS web application
│   ├── src/                # Frontend source code
│   │   ├── App.tsx         # Main entry shell and view states
│   │   ├── config.ts       # Backend endpoint url config loader
│   │   └── index.css       # Tailwind CSS and global style definitions
│   ├── package.json        # NPM dependencies configuration
│   └── vite.config.ts      # Vite configuration file
├── run_app.sh              # Project root unified concurrent launcher
├── srs_document.md         # Software Requirements Specification (SRS)
└── .gitignore              # Ignored local artifacts list
```

---

## 💎 Core Features & Logic Calculations

### 1. Employee Registry & Parameter Customization
Admin onboarding page to register personnel profiles using alphanumeric IDs, full names, and hourly base rates. Calculates workforce payments using per-employee hourly rates rather than global averages.

### 2. Daily Attendance Ledger & Implicit Logic
* **Positive Entry**: Manually logged working hours for an employee updates their status to `Present`.
* **Null Entry**: Skipped fields default status to `Absent`, allocating an earned daily base wage of exactly `$0.00`.
* **Wage Formula**:
  $$\text{Daily Base Wage Earnings} = (\text{Manually Appended Hours}) \times (\text{Pre-configured Employee Base Rate})$$

### 3. Extra Work & Flat Tag Allocations
Present employees can accept task extensions (e.g. `Husk Packing`, `Rice delivery`, `Paddy`, or a custom defined tag) which apply direct flat currency bonuses to the daily gross total rather than computing variable hours.

### 4. Financial Advance Ledger
Logs transactional debits (loans or cash advances) issued to employees during an active cycle. Accumulated monthly advances function as an immediate negative deduction modifier.

### 5. Monthly Aggregation & Immutable Hard-Lock
* **Compensation Formula**:
  $$\text{Net Monthly Payout} = \sum(\text{Daily Base Wage Earnings}) + \sum(\text{Extra Work Flat Amounts}) - \sum(\text{Issued Cash Advances})$$
* **Hard Lock**: फाइनल (Locking) payroll cycles writes read-only locks to the database, preventing subsequent updates or deletions.

### 6. Dual Reporting Engine
Generates and downloads styled Excel spreadsheets (`.xlsx`) and print-ready PDF Registers/Breakdown Receipt Vouchers (`.pdf`) directly from the server.
