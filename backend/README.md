# FastAPI Backend Engine

The backend engine handles data persistence, domain calculations, immutable locking constraints, and report document compilation.

---

## 🛠️ Tech Stack & Dependencies

* **Runtime**: Python 3.12+
* **Framework**: FastAPI (Asynchronous Web Framework)
* **Web Server**: Uvicorn (ASGI server implementation)
* **ORM**: SQLAlchemy
* **Excel Compiler**: `openpyxl`
* **PDF Compiler**: `reportlab`
* **Driver**: `psycopg2-binary` (for production Postgres connections)

---

## ⚙️ Configuration & Environment Variables

The application can be configured dynamically using environment variables:

| Variable | Description | Default |
| :--- | :--- | :--- |
| `DATABASE_URL` | SQLAlchemy database connection string | `sqlite:///./payroll.db` (Local SQLite file) |
| `ALLOWED_ORIGINS` | Comma-separated list of CORS origins allowed to access the API | `http://localhost:5173,http://127.0.0.1:5173` |
| `ALLOW_ALL_CORS` | Overrides origins filter to allow wildcard connection (for simple dev staging) | `false` |

*To switch to production Supabase PostgreSQL, set:*
```bash
export DATABASE_URL="postgresql://postgres:[password]@db.[id].supabase.co:5432/postgres"
```

---

## 🚀 Running the Backend Separately

1. Navigate to the backend directory:
   ```bash
   cd ~/Desktop/Project_AI/Payroll/backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python3.12 -m venv venv
   source venv/bin/activate
   ```
3. Install required packages:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the server using the shell helper:
   ```bash
   ./run.sh
   ```
   *Or manually launch Uvicorn:*
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

---

## 🛣️ API Endpoint Register

### 1. Employees (`/api/employees`)
* `GET /api/employees` - Retrieve all employees (optionally filtered using `active_only=true`).
* `POST /api/employees` - Add a new employee profile.
* `PUT /api/employees/{employee_id}` - Update name, rate, or active status.

### 2. Daily Attendance Ledger (`/api/attendance`)
* `GET /api/attendance?date_str=YYYY-MM-DD` - Retrieve timesheets and extra work logs for a given date. Missing records automatically populate as transient `Absent` objects.
* `POST /api/attendance` - Record hours for an employee (updates status to `Present` if hours > 0, else `Absent`).
* `POST /api/attendance/{attendance_id}/extra-work` - Attach a flat-rate extra work bonus tag.
* `DELETE /api/attendance/extra-work/{extra_work_id}` - Delete an extra work task bonus.

### 3. Cash Advances (`/api/advances`)
* `GET /api/advances?month=YYYY-MM` - Retrieve all cash advances issued in the given cycle.
* `POST /api/advances` - Document a cash advance transaction.
* `DELETE /api/advances/{advance_id}` - Void a cash advance entry.

### 4. Locking (`/api/cycles`)
* `GET /api/cycles/{month}` - Fetch the lock status of a month.
* `POST /api/cycles/lock` - Hard-lock a monthly cycle (mutates `is_locked` to `true`).

### 5. Reports (`/api/reports`)
* `GET /api/reports/summary?month=YYYY-MM` - Get aggregated values (Base Pay, Extra Work, Advances, Net Payouts).
* `GET /api/reports/excel?month=YYYY-MM` - Stream a styled Excel sheet (`.xlsx`) matching the ledger matrix.
* `GET /api/reports/pdf?month=YYYY-MM` - Stream print-ready PDF Registers and employee vouchers.
