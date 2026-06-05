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

export interface ActivityLog {
  id: string;
  timestamp: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOCK' | 'ERROR';
  entity: 'Employee' | 'Attendance' | 'Cash Advance' | 'Cycle' | 'Supplier' | 'Delivery';
  message: string;
}

export interface PaddyDelivery {
  id: number;
  supplier_id: number;
  delivery_date: string;
  variety: string;
  weight: number;
  created_at: string;
}

export interface PaddySupplier {
  id: number;
  supplier_id: string;
  name: string;
  contact_number: string;
  location: string;
  created_at: string;
}

export interface PaddySupplierDetail extends PaddySupplier {
  deliveries: PaddyDelivery[];
}

export interface YoYComparisonItem {
  year: number;
  deliveries_count: number;
  aggregate_weight: number;
  variance_percentage: number | null;
}

export interface PaddySupplierYoYReport {
  supplier_id: string;
  name: string;
  active_year: number;
  active_deliveries_count: number;
  active_cumulative_weight: number;
  yoy_grid: YoYComparisonItem[];
}

export interface PaddyProcurementAnalytics {
  active_year: number;
  total_combined_volume: number;
}
