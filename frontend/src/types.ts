export interface Employee {
  id: number;
  employee_id: string;
  name: string;
  hourly_rate: number;
  is_active: boolean;
  created_at: string;
}

export interface ExtraWork {
  id: number;
  attendance_id: number;
  tag: string;
  amount: number;
  description?: string;
}

export interface Attendance {
  id: number;
  employee_id: number;
  date: string;
  hours_logged: number | null;
  status: string;
  employee: Employee;
  extra_work: ExtraWork[];
}

export interface CashAdvanceDetail {
  id: number;
  employee_id: number;
  date: string;
  amount: number;
  description?: string;
  employee: Employee;
}

export interface MonthlySummaryItem {
  employee_db_id: number;
  employee_id: string;
  name: string;
  aggregate_hours: number;
  base_pay_subtotal: number;
  aggregated_extra_work: number;
  advance_reductions: number;
  net_cash_payout: number;
  is_active: boolean;
}

export interface MonthlySummary {
  month: string;
  is_locked: boolean;
  items: MonthlySummaryItem[];
  total_hours: number;
  total_base_pay: number;
  total_extra_work: number;
  total_advances: number;
  total_net_payout: number;
}
