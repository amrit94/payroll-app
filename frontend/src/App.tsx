import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  Lock, 
  Unlock, 
  FileSpreadsheet, 
  FileText, 
  Plus, 
  Trash, 
  Check, 
  X,
  ChevronRight, 
  Info,
  CalendarDays,
  TrendingUp,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { API_BASE_URL } from './config';

// TypeScript Interfaces
interface Employee {
  id: number;
  employee_id: string;
  name: string;
  hourly_rate: number;
  is_active: boolean;
  created_at: string;
}

interface ExtraWork {
  id: number;
  attendance_id: number;
  tag: string;
  amount: number;
  description?: string;
}

interface Attendance {
  id: number;
  employee_id: number;
  date: string;
  hours_logged: number | null;
  status: string;
  employee: Employee;
  extra_work: ExtraWork[];
}

interface CashAdvanceDetail {
  id: number;
  employee_id: number;
  date: string;
  amount: number;
  description?: string;
  employee: Employee;
}

interface MonthlySummaryItem {
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

interface MonthlySummary {
  month: string;
  is_locked: boolean;
  items: MonthlySummaryItem[];
  total_hours: number;
  total_base_pay: number;
  total_extra_work: number;
  total_advances: number;
  total_net_payout: number;
}

export default function App() {
  // Navigation & Date contexts
  const [activeTab, setActiveTab] = useState<'dashboard' | 'attendance' | 'employees' | 'advances' | 'reports'>('dashboard');
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().substring(0, 7)); // YYYY-MM
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().substring(0, 10)); // YYYY-MM-DD
  const [isCycleLocked, setIsCycleLocked] = useState<boolean>(false);

  // App Data State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [advances, setAdvances] = useState<CashAdvanceDetail[]>([]);
  const [summary, setSummary] = useState<MonthlySummary | null>(null);

  // Modal / Input States
  const [showAddEmpModal, setShowAddEmpModal] = useState<boolean>(false);
  const [showEditEmpModal, setShowEditEmpModal] = useState<boolean>(false);
  const [currentEmp, setCurrentEmp] = useState<Employee | null>(null);
  
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpId, setNewEmpId] = useState('');
  const [newEmpRate, setNewEmpRate] = useState<number>(20.00);
  const [newEmpStatus, setNewEmpStatus] = useState<boolean>(true);

  // Extra work allocation modal
  const [showExtraWorkModal, setShowExtraWorkModal] = useState<boolean>(false);
  const [activeAttendanceId, setActiveAttendanceId] = useState<number | null>(null);
  const [extraWorkTag, setExtraWorkTag] = useState<'Husk Packing' | 'Rice delivery' | 'Paddy' | 'Custom'>('Husk Packing');
  const [customTag, setCustomTag] = useState('');
  const [extraWorkAmount, setExtraWorkAmount] = useState<number>(0);
  const [extraWorkDesc, setExtraWorkDesc] = useState('');

  // Cash Advance allocation modal
  const [showAdvanceModal, setShowAdvanceModal] = useState<boolean>(false);
  const [advEmployeeId, setAdvEmployeeId] = useState<number | null>(null);
  const [advDate, setAdvDate] = useState(new Date().toISOString().substring(0, 10));
  const [advAmount, setAdvAmount] = useState<number>(0);
  const [advDesc, setAdvDesc] = useState('');

  // General feedback messages
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Fetch initial data & react to context changes
  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (activeTab === 'attendance') {
      fetchAttendance(selectedDate);
    }
  }, [selectedDate, activeTab]);

  useEffect(() => {
    if (activeTab === 'advances') {
      fetchAdvances(selectedMonth);
    }
  }, [selectedMonth, activeTab]);

  useEffect(() => {
    if (activeTab === 'reports' || activeTab === 'dashboard') {
      fetchSummary(selectedMonth);
    }
    fetchCycleLock(selectedMonth);
  }, [selectedMonth, activeTab]);

  // Toast alert auto-clear helper
  const showToast = (message: string, isError: boolean = false) => {
    if (isError) {
      setErrorMsg(message);
      setTimeout(() => setErrorMsg(null), 5000);
    } else {
      setSuccessMsg(message);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  // --- API OPERATIONS ---

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/employees`);
      setEmployees(res.data);
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Failed to load employees", true);
    }
  };

  const fetchCycleLock = async (month: string) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/cycles/${month}`);
      setIsCycleLocked(res.data.is_locked);
    } catch (err) {
      setIsCycleLocked(false);
    }
  };

  const fetchAttendance = async (dateStr: string) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/attendance?date_str=${dateStr}`);
      setAttendance(res.data);
      // Synchronize lock status for the date
      await fetchCycleLock(dateStr.substring(0, 7));
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Failed to fetch daily ledger", true);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdvances = async (monthStr: string) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/advances?month=${monthStr}`);
      setAdvances(res.data);
      await fetchCycleLock(monthStr);
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Failed to fetch cash advances", true);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async (monthStr: string) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/reports/summary?month=${monthStr}`);
      setSummary(res.data);
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Failed to compile monthly aggregation", true);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpId.trim() || !newEmpName.trim()) {
      showToast("All fields are required to register an employee", true);
      return;
    }
    try {
      await axios.post(`${API_BASE_URL}/api/employees`, {
        employee_id: newEmpId,
        name: newEmpName,
        hourly_rate: Number(newEmpRate),
        is_active: newEmpStatus
      });
      showToast("New employee successfully onboarded");
      setShowAddEmpModal(false);
      // Reset state
      setNewEmpId('');
      setNewEmpName('');
      setNewEmpRate(20);
      setNewEmpStatus(true);
      fetchEmployees();
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Error onboarding employee", true);
    }
  };

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEmp) return;
    try {
      await axios.put(`${API_BASE_URL}/api/employees/${currentEmp.id}`, {
        name: newEmpName,
        hourly_rate: Number(newEmpRate),
        is_active: newEmpStatus
      });
      showToast("Employee details updated successfully");
      setShowEditEmpModal(false);
      setCurrentEmp(null);
      fetchEmployees();
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Error updating employee profile", true);
    }
  };

  const handleAttendanceChange = async (employeeId: number, hours: string) => {
    // If hours is empty, map it as null (Absent state)
    const hoursNum = hours === "" ? null : Number(hours);
    try {
      await axios.post(`${API_BASE_URL}/api/attendance`, {
        employee_id: employeeId,
        date: selectedDate,
        hours_logged: hoursNum
      });
      // Soft refresh local attendance array
      fetchAttendance(selectedDate);
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Error recording hours. Check lock state.", true);
    }
  };

  const handleOpenExtraWork = (attId: number) => {
    setActiveAttendanceId(attId);
    setExtraWorkTag('Husk Packing');
    setCustomTag('');
    setExtraWorkAmount(10);
    setExtraWorkDesc('');
    setShowExtraWorkModal(true);
  };

  const handleAddExtraWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAttendanceId) return;

    const finalTag = extraWorkTag === 'Custom' ? customTag : extraWorkTag;
    if (!finalTag.trim()) {
      showToast("Please provide a classification tag descriptive label", true);
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/api/attendance/${activeAttendanceId}/extra-work`, {
        tag: finalTag,
        amount: Number(extraWorkAmount),
        description: extraWorkDesc || undefined
      });
      showToast("Bonus extra work tag successfully allocated.");
      setShowExtraWorkModal(false);
      fetchAttendance(selectedDate);
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Failed to append extra work tag. Verify present status.", true);
    }
  };

  const handleDeleteExtraWork = async (extraId: number) => {
    if (window.confirm("Are you sure you want to remove this extra work assignment?")) {
      try {
        await axios.delete(`${API_BASE_URL}/api/attendance/extra-work/${extraId}`);
        showToast("Extra work bonus removed.");
        fetchAttendance(selectedDate);
      } catch (err: any) {
        showToast(err.response?.data?.detail || "Failed to delete extra work record", true);
      }
    }
  };

  const handleAddAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!advEmployeeId) {
      showToast("Please select an employee to assign advance", true);
      return;
    }
    try {
      await axios.post(`${API_BASE_URL}/api/advances`, {
        employee_id: advEmployeeId,
        date: advDate,
        amount: Number(advAmount),
        description: advDesc || undefined
      });
      showToast("Cash advance transactions documented persistently.");
      setShowAdvanceModal(false);
      // Reset forms
      setAdvAmount(0);
      setAdvDesc('');
      fetchAdvances(selectedMonth);
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Failed to register advance. Month may be locked.", true);
    }
  };

  const handleDeleteAdvance = async (advId: number) => {
    if (window.confirm("Are you sure you want to void this cash advance?")) {
      try {
        await axios.delete(`${API_BASE_URL}/api/advances/${advId}`);
        showToast("Advance transaction voided.");
        fetchAdvances(selectedMonth);
      } catch (err: any) {
        showToast(err.response?.data?.detail || "Failed to delete cash advance", true);
      }
    }
  };

  const handleLockCycle = async () => {
    if (window.confirm(`CRITICAL CONFIRMATION:\n\nAre you sure you want to lock the payroll cycle for '${selectedMonth}'?\n\nThis is an IMMUTABLE action. All work logs, rates, extra tags, and advance values in this month will lock into read-only records. This prevents any further modifications.`)) {
      try {
        await axios.post(`${API_BASE_URL}/api/cycles/lock`, {
          month: selectedMonth
        });
        showToast("Payroll cycle locked successfully. All historical sheets are now read-only.");
        setIsCycleLocked(true);
        fetchSummary(selectedMonth);
      } catch (err: any) {
        showToast(err.response?.data?.detail || "Failed to lock cycle", true);
      }
    }
  };

  const handleExportExcel = () => {
    window.open(`${API_BASE_URL}/api/reports/excel?month=${selectedMonth}`);
  };

  const handleExportPdf = () => {
    window.open(`${API_BASE_URL}/api/reports/pdf?month=${selectedMonth}`);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#080b11] text-slate-100 font-sans">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-68 bg-[#0d121f] border-b md:border-b-0 md:border-r border-slate-800 flex flex-col">
        {/* Brand header */}
        <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
          <div className="p-2.5 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-xl shadow-lg shadow-indigo-500/20">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white m-0">Payroll Ledger</h1>
            <p className="text-[10px] text-indigo-400 font-medium uppercase tracking-wider">SuperAdmin Hub</p>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 p-4 space-y-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 text-left min-h-[44px] ${
              activeTab === 'dashboard'
                ? 'bg-gradient-to-r from-indigo-600/20 to-violet-600/10 text-indigo-300 border-l-4 border-indigo-500 font-medium'
                : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="h-5 w-5" />
            <span>Dashboard</span>
          </button>
          
          <button
            onClick={() => setActiveTab('attendance')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 text-left min-h-[44px] ${
              activeTab === 'attendance'
                ? 'bg-gradient-to-r from-indigo-600/20 to-violet-600/10 text-indigo-300 border-l-4 border-indigo-500 font-medium'
                : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
            }`}
          >
            <CalendarDays className="h-5 w-5" />
            <span>Attendance Ledger</span>
          </button>
          
          <button
            onClick={() => setActiveTab('employees')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 text-left min-h-[44px] ${
              activeTab === 'employees'
                ? 'bg-gradient-to-r from-indigo-600/20 to-violet-600/10 text-indigo-300 border-l-4 border-indigo-500 font-medium'
                : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
            }`}
          >
            <Users className="h-5 w-5" />
            <span>Employee Registry</span>
          </button>
          
          <button
            onClick={() => setActiveTab('advances')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 text-left min-h-[44px] ${
              activeTab === 'advances'
                ? 'bg-gradient-to-r from-indigo-600/20 to-violet-600/10 text-indigo-300 border-l-4 border-indigo-500 font-medium'
                : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
            }`}
          >
            <DollarSign className="h-5 w-5" />
            <span>Cash Advances</span>
          </button>
          
          <button
            onClick={() => setActiveTab('reports')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 text-left min-h-[44px] ${
              activeTab === 'reports'
                ? 'bg-gradient-to-r from-indigo-600/20 to-violet-600/10 text-indigo-300 border-l-4 border-indigo-500 font-medium'
                : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
            }`}
          >
            <FileText className="h-5 w-5" />
            <span>Lock & Export</span>
          </button>
        </nav>

        {/* Global Month Selection Widget at Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#0a0e18]">
          <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1.5 tracking-wider">Active Cycle</label>
          <div className="relative">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full bg-[#111827] text-slate-100 rounded-xl px-3 py-2 border border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
            />
          </div>
          <div className="mt-2.5 flex items-center justify-between text-xs px-1">
            <span className="text-slate-400">Lock Status:</span>
            {isCycleLocked ? (
              <span className="flex items-center text-amber-400 font-medium">
                <Lock className="h-3 w-3 mr-1" /> Locked
              </span>
            ) : (
              <span className="flex items-center text-emerald-400 font-medium">
                <Unlock className="h-3 w-3 mr-1" /> Open
              </span>
            )}
          </div>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl">
        
        {/* TOAST ALERTS */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded-2xl flex items-center space-x-3 animate-fade-in">
            <AlertTriangle className="h-5 w-5 text-rose-400 flex-shrink-0" />
            <span className="text-sm font-medium">{errorMsg}</span>
          </div>
        )}
        
        {successMsg && (
          <div className="mb-6 p-4 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-2xl flex items-center space-x-3 animate-fade-in">
            <Check className="h-5 w-5 text-emerald-400 flex-shrink-0" />
            <span className="text-sm font-medium">{successMsg}</span>
          </div>
        )}

        {/* TAB CONTENTS */}

        {/* 1. DASHBOARD VIEW */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-slide-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white">Dashboard Overview</h2>
                <p className="text-sm text-slate-400">Payroll aggregation and tracking for active cycle: <b>{selectedMonth}</b></p>
              </div>
            </div>

            {/* Metric Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="glass p-5 rounded-3xl relative overflow-hidden">
                <div className="absolute right-0 top-0 h-24 w-24 bg-indigo-500/5 rounded-full blur-xl"></div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Net Monthly Payout</p>
                <p className="text-3xl font-extrabold text-white mt-2">${summary?.total_net_payout.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) || "0.00"}</p>
                <div className="mt-3 text-xs text-indigo-400 font-semibold flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" /> Aggregate of cycle base pay + tags - advances
                </div>
              </div>

              <div className="glass p-5 rounded-3xl relative overflow-hidden">
                <div className="absolute right-0 top-0 h-24 w-24 bg-violet-500/5 rounded-full blur-xl"></div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Base Hours Logged</p>
                <p className="text-3xl font-extrabold text-white mt-2">{summary?.total_hours.toFixed(2) || "0.00"} Hrs</p>
                <div className="mt-3 text-xs text-violet-400 font-semibold flex items-center">
                  <Calendar className="h-3 w-3 mr-1" /> Cumulative cycle workforce timesheet
                </div>
              </div>

              <div className="glass p-5 rounded-3xl relative overflow-hidden">
                <div className="absolute right-0 top-0 h-24 w-24 bg-emerald-500/5 rounded-full blur-xl"></div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Aggregated Extra Work</p>
                <p className="text-3xl font-extrabold text-white mt-2">${summary?.total_extra_work.toLocaleString(undefined, {minimumFractionDigits: 2}) || "0.00"}</p>
                <div className="mt-3 text-xs text-emerald-400 font-semibold flex items-center">
                  <Sparkles className="h-3 w-3 mr-1" /> Standard flat-rate deliverable payouts
                </div>
              </div>

              <div className="glass p-5 rounded-3xl relative overflow-hidden">
                <div className="absolute right-0 top-0 h-24 w-24 bg-amber-500/5 rounded-full blur-xl"></div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Advances Issued</p>
                <p className="text-3xl font-extrabold text-amber-300 mt-2">-${summary?.total_advances.toLocaleString(undefined, {minimumFractionDigits: 2}) || "0.00"}</p>
                <div className="mt-3 text-xs text-amber-400 font-semibold flex items-center">
                  <Info className="h-3 w-3 mr-1" /> Instant cycle deductions/loans
                </div>
              </div>
            </div>

            {/* Quick Actions & Cycle Widget */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Lock Status Card */}
              <div className="lg:col-span-1 glass p-6 rounded-3xl flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Cycle Commitments</h3>
                  <p className="text-sm text-slate-400 mb-6">Locking compiles immutable monthly logs preventing post-hoc edits.</p>
                </div>
                
                <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80 mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400">Target Month:</span>
                    <span className="text-sm font-bold text-indigo-300">{selectedMonth}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">Cycle Lock:</span>
                    {isCycleLocked ? (
                      <span className="text-xs bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-full font-bold flex items-center">
                        <Lock className="h-3.5 w-3.5 mr-1" /> LOCKED
                      </span>
                    ) : (
                      <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full font-bold flex items-center">
                        <Unlock className="h-3.5 w-3.5 mr-1" /> OPEN
                      </span>
                    )}
                  </div>
                </div>

                {!isCycleLocked ? (
                  <button
                    onClick={handleLockCycle}
                    className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold py-3 px-4 rounded-2xl transition-all duration-200 min-h-[44px] shadow-lg shadow-amber-600/10"
                  >
                    <Lock className="h-5 w-5" />
                    <span>Hard Lock Payouts</span>
                  </button>
                ) : (
                  <div className="text-center py-3 bg-amber-950/20 border border-amber-900/30 text-amber-400 rounded-2xl font-bold flex items-center justify-center space-x-2">
                    <Lock className="h-5 w-5" />
                    <span>Payroll Locked & Safe</span>
                  </div>
                )}
              </div>

              {/* Quick Export Panel */}
              <div className="lg:col-span-2 glass p-6 rounded-3xl flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Reporting Documents</h3>
                  <p className="text-sm text-slate-400 mb-6">Build dynamic ledger matrices and print-ready vouchers directly from cached aggregates.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                  <button
                    onClick={handleExportExcel}
                    className="flex flex-col items-center justify-center p-6 bg-[#0f1a24] hover:bg-[#152737] border border-[#1e3b56]/40 rounded-2xl transition-all duration-200 group text-center min-h-[100px]"
                  >
                    <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl group-hover:scale-110 transition-transform duration-200 mb-3">
                      <FileSpreadsheet className="h-6 w-6" />
                    </div>
                    <span className="text-sm font-bold text-slate-200">Compile Excel (.xlsx)</span>
                    <span className="text-xs text-slate-500 mt-1">Full detailed matrices</span>
                  </button>

                  <button
                    onClick={handleExportPdf}
                    className="flex flex-col items-center justify-center p-6 bg-[#1f1929] hover:bg-[#2c223a] border border-[#3e2c56]/40 rounded-2xl transition-all duration-200 group text-center min-h-[100px]"
                  >
                    <div className="p-3 bg-violet-500/10 text-violet-400 rounded-xl group-hover:scale-110 transition-transform duration-200 mb-3">
                      <FileText className="h-6 w-6" />
                    </div>
                    <span className="text-sm font-bold text-slate-200">Generate PDF (.pdf)</span>
                    <span className="text-xs text-slate-500 mt-1">Accounting voucher registers</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. ATTENDANCE ENTRY LEDGER */}
        {activeTab === 'attendance' && (
          <div className="space-y-6 animate-slide-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white">Daily Attendance Ledger</h2>
                <p className="text-sm text-slate-400">Map system hours to intuitive registers. Null inputs default as absent (0.00 base pay).</p>
              </div>

              {/* Date selection widget */}
              <div className="flex items-center space-x-3">
                <span className="text-sm text-slate-400 font-medium">Tracking Date:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-[#0f172a] border border-slate-700 text-slate-100 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
                />
              </div>
            </div>

            {isCycleLocked && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-2xl flex items-center space-x-3">
                <Lock className="h-5 w-5 text-amber-400" />
                <span className="text-sm font-medium">This date belongs to a LOCKED cycle. Operational values are read-only.</span>
              </div>
            )}

            {/* Attendance Table */}
            <div className="glass rounded-3xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-[#0c101d]">
                      <th className="p-4 text-xs uppercase font-bold text-slate-400 tracking-wider">Employee ID</th>
                      <th className="p-4 text-xs uppercase font-bold text-slate-400 tracking-wider">Name</th>
                      <th className="p-4 text-xs uppercase font-bold text-slate-400 tracking-wider">Base Rate</th>
                      <th className="p-4 text-xs uppercase font-bold text-slate-400 tracking-wider">State status</th>
                      <th className="p-4 text-xs uppercase font-bold text-slate-400 tracking-wider w-40">Hours Logged</th>
                      <th className="p-4 text-xs uppercase font-bold text-slate-400 tracking-wider w-48">Daily Base Wages</th>
                      <th className="p-4 text-xs uppercase font-bold text-slate-400 tracking-wider">Extra Work Flat Bonuses</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400">Loading daily ledger sheets...</td>
                      </tr>
                    ) : attendance.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400">No active employees onboarded in the system. Go to Employee Registry to add.</td>
                      </tr>
                    ) : (
                      attendance.map((log) => {
                        const wage = (log.hours_logged || 0) * log.employee.hourly_rate;
                        const isPresent = log.status === 'Present';
                        
                        return (
                          <tr key={log.employee.id} className="hover:bg-slate-900/30 transition-colors">
                            {/* ID */}
                            <td className="p-4 font-mono text-sm text-slate-300">{log.employee.employee_id}</td>
                            
                            {/* Name */}
                            <td className="p-4 font-bold text-white">{log.employee.name}</td>
                            
                            {/* Rate */}
                            <td className="p-4 text-sm text-indigo-300 font-semibold">${log.employee.hourly_rate.toFixed(2)}/hr</td>
                            
                            {/* Status Indicator */}
                            <td className="p-4">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                                isPresent ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'
                              }`}>
                                <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${
                                  isPresent ? 'bg-emerald-400' : 'bg-slate-500'
                                }`}></span>
                                {log.status}
                              </span>
                            </td>
                            
                            {/* Input Hours */}
                            <td className="p-4">
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                max="24"
                                value={log.hours_logged === null ? "" : log.hours_logged}
                                onChange={(e) => handleAttendanceChange(log.employee.id, e.target.value)}
                                disabled={isCycleLocked}
                                placeholder="0.00"
                                className="w-24 bg-[#111827] text-slate-200 border border-slate-700 rounded-xl px-3 py-1.5 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
                              />
                            </td>

                            {/* Base Pay Calculated */}
                            <td className="p-4 font-mono text-sm font-bold text-slate-200">
                              ${wage.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                            </td>

                            {/* Extra Work tags */}
                            <td className="p-4 space-y-2">
                              {isPresent ? (
                                <>
                                  <div className="flex flex-wrap gap-2 items-center">
                                    {log.extra_work.map((extra) => (
                                      <span key={extra.id} className="inline-flex items-center px-2.5 py-1 bg-indigo-500/10 text-indigo-300 text-xs font-bold rounded-xl border border-indigo-500/20">
                                        <b>{extra.tag}</b>: ${extra.amount.toFixed(2)}
                                        {!isCycleLocked && (
                                          <button
                                            onClick={() => handleDeleteExtraWork(extra.id)}
                                            className="ml-1.5 text-indigo-400 hover:text-rose-400 transition-colors"
                                          >
                                            <X className="h-3 w-3" />
                                          </button>
                                        )}
                                      </span>
                                    ))}

                                    {!isCycleLocked && (
                                      <button
                                        onClick={() => handleOpenExtraWork(log.id)}
                                        className="inline-flex items-center space-x-1 px-2.5 py-1 border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500 text-xs rounded-xl min-h-[30px]"
                                      >
                                        <Plus className="h-3.5 w-3.5" />
                                        <span>Add Tag</span>
                                      </button>
                                    )}
                                  </div>
                                </>
                              ) : (
                                <span className="text-xs text-slate-500 italic">No extra work on Absent status</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 3. EMPLOYEE REGISTRY */}
        {activeTab === 'employees' && (
          <div className="space-y-6 animate-slide-up">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white">Employee Registry</h2>
                <p className="text-sm text-slate-400">Configure profile-specific base pay structures and statuses.</p>
              </div>

              <button
                onClick={() => {
                  setNewEmpId('');
                  setNewEmpName('');
                  setNewEmpRate(20.00);
                  setNewEmpStatus(true);
                  setShowAddEmpModal(true);
                }}
                className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl transition-all duration-200 min-h-[44px]"
              >
                <Plus className="h-5 w-5" />
                <span>Onboard Employee</span>
              </button>
            </div>

            {/* Employee Directory grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {employees.map((emp) => (
                <div key={emp.id} className="glass p-6 rounded-3xl flex flex-col justify-between space-y-4 relative overflow-hidden">
                  <div className="absolute right-0 top-0 h-16 w-16 bg-indigo-500/5 rounded-full blur-lg"></div>
                  
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-mono font-bold text-indigo-400 tracking-wider">{emp.employee_id}</p>
                      <h3 className="text-lg font-extrabold text-white mt-1">{emp.name}</h3>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                      emp.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                    }`}>
                      {emp.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider">Per-Hour Base pay</span>
                      <span className="text-xl font-extrabold text-white mt-1">${emp.hourly_rate.toFixed(2)}</span>
                    </div>
                    
                    <button
                      onClick={() => {
                        setCurrentEmp(emp);
                        setNewEmpName(emp.name);
                        setNewEmpRate(emp.hourly_rate);
                        setNewEmpStatus(emp.is_active);
                        setShowEditEmpModal(true);
                      }}
                      className="inline-flex items-center justify-center p-2 hover:bg-slate-800 rounded-xl border border-slate-700 hover:border-slate-500 text-slate-300 transition-colors min-h-[44px] min-w-[44px]"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. CASH ADVANCES LEDGER */}
        {activeTab === 'advances' && (
          <div className="space-y-6 animate-slide-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white">Financial Advance Ledger</h2>
                <p className="text-sm text-slate-400">Issue cash loans or advances. Reductions deduct negative metrics from monthly payouts.</p>
              </div>

              <button
                onClick={() => {
                  setAdvEmployeeId(employees[0]?.id || null);
                  setAdvAmount(50);
                  setAdvDesc('');
                  setShowAdvanceModal(true);
                }}
                disabled={isCycleLocked || employees.length === 0}
                className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 px-4 rounded-xl transition-all duration-200 min-h-[44px]"
              >
                <Plus className="h-5 w-5" />
                <span>Issue Cash Advance</span>
              </button>
            </div>

            {isCycleLocked && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-2xl flex items-center space-x-3">
                <Lock className="h-5 w-5 text-amber-400" />
                <span className="text-sm font-medium">This month cycle is LOCKED. Cash advance updates are disabled.</span>
              </div>
            )}

            {/* Advances Table */}
            <div className="glass rounded-3xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-[#0c101d]">
                      <th className="p-4 text-xs uppercase font-bold text-slate-400 tracking-wider">Date Issued</th>
                      <th className="p-4 text-xs uppercase font-bold text-slate-400 tracking-wider">Employee ID</th>
                      <th className="p-4 text-xs uppercase font-bold text-slate-400 tracking-wider">Employee Name</th>
                      <th className="p-4 text-xs uppercase font-bold text-slate-400 tracking-wider">Deduction Amount</th>
                      <th className="p-4 text-xs uppercase font-bold text-slate-400 tracking-wider">Description / Note</th>
                      {!isCycleLocked && <th className="p-4 text-xs uppercase font-bold text-slate-400 tracking-wider">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400">Loading cash loans records...</td>
                      </tr>
                    ) : advances.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400">No cash advances issued during the calendar month of {selectedMonth}.</td>
                      </tr>
                    ) : (
                      advances.map((adv) => (
                        <tr key={adv.id} className="hover:bg-slate-900/30 transition-colors">
                          <td className="p-4 text-sm text-slate-300">{adv.date}</td>
                          <td className="p-4 font-mono text-sm text-slate-400">{adv.employee.employee_id}</td>
                          <td className="p-4 font-bold text-white">{adv.employee.name}</td>
                          <td className="p-4 text-sm font-bold text-amber-400">-${adv.amount.toFixed(2)}</td>
                          <td className="p-4 text-sm text-slate-400">{adv.description || "N/A"}</td>
                          {!isCycleLocked && (
                            <td className="p-4">
                              <button
                                onClick={() => handleDeleteAdvance(adv.id)}
                                className="p-2 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-xl transition-colors min-h-[40px] min-w-[40px] inline-flex items-center justify-center"
                              >
                                <Trash className="h-4 w-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 5. LOCK & EXPORTS (MONTHLY COMPENSATION AGGREGATION) */}
        {activeTab === 'reports' && (
          <div className="space-y-6 animate-slide-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white">Monthly Summary Ledger</h2>
                <p className="text-sm text-slate-400">Final aggregates validation and reporting compilation. Month: <b>{selectedMonth}</b></p>
              </div>

              {/* Export actions */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleExportExcel}
                  className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl transition-colors min-h-[44px]"
                >
                  <FileSpreadsheet className="h-5 w-5" />
                  <span>Download Excel</span>
                </button>

                <button
                  onClick={handleExportPdf}
                  className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl transition-colors min-h-[44px]"
                >
                  <FileText className="h-5 w-5" />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>

            {/* Lock slider / banner */}
            <div className="glass p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center">
                  {isCycleLocked ? (
                    <>
                      <Lock className="h-5 w-5 mr-2 text-amber-400" />
                      <span>Immutable Historical Record Commit</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="h-5 w-5 mr-2 text-emerald-400" />
                      <span>Review Draft Payroll Ledger</span>
                    </>
                  )}
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  {isCycleLocked 
                    ? "This cycle has been finalized. Databases locked against modifications." 
                    : "Review the ledger below. Make sure logs are final, then seal the cycle."}
                </p>
              </div>

              {!isCycleLocked ? (
                <button
                  onClick={handleLockCycle}
                  className="flex items-center space-x-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold py-3 px-6 rounded-2xl transition-all duration-200 min-h-[44px] shadow-lg shadow-amber-600/10"
                >
                  <Lock className="h-5 w-5" />
                  <span>Lock Payroll Cycle</span>
                </button>
              ) : (
                <span className="px-4 py-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold rounded-2xl flex items-center space-x-2 text-sm">
                  <Lock className="h-4.5 w-4.5" />
                  <span>Cycle Finalized</span>
                </span>
              )}
            </div>

            {/* Compiled aggregates table */}
            <div className="glass rounded-3xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-[#0c101d]">
                      <th className="p-4 text-xs uppercase font-bold text-slate-400 tracking-wider">Emp ID</th>
                      <th className="p-4 text-xs uppercase font-bold text-slate-400 tracking-wider">Employee Name</th>
                      <th className="p-4 text-xs uppercase font-bold text-slate-400 tracking-wider text-right">Aggregate Hours</th>
                      <th className="p-4 text-xs uppercase font-bold text-slate-400 tracking-wider text-right">Base pay Subtotal</th>
                      <th className="p-4 text-xs uppercase font-bold text-slate-400 tracking-wider text-right">Extra Work Bonuses</th>
                      <th className="p-4 text-xs uppercase font-bold text-slate-400 tracking-wider text-right">Advance Reductions</th>
                      <th className="p-4 text-xs uppercase font-bold text-slate-400 tracking-wider text-right">Net Cash Payout</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400">Compiling monthly aggregates ledger...</td>
                      </tr>
                    ) : !summary || summary.items.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400">No data compiled for the calendar cycle. Check dates entry.</td>
                      </tr>
                    ) : (
                      <>
                        {summary.items.map((item) => (
                          <tr key={item.employee_id} className="hover:bg-slate-900/30 transition-colors">
                            <td className="p-4 font-mono text-sm text-slate-300">{item.employee_id}</td>
                            <td className="p-4 font-bold text-white">{item.name}</td>
                            <td className="p-4 text-sm text-slate-300 text-right font-mono">{item.aggregate_hours.toFixed(2)}</td>
                            <td className="p-4 text-sm text-slate-300 text-right font-mono">${item.base_pay_subtotal.toFixed(2)}</td>
                            <td className="p-4 text-sm text-emerald-400 text-right font-mono">+${item.aggregated_extra_work.toFixed(2)}</td>
                            <td className="p-4 text-sm text-amber-400 text-right font-mono">-${item.advance_reductions.toFixed(2)}</td>
                            <td className="p-4 text-sm font-bold text-white text-right font-mono bg-indigo-500/5">${item.net_cash_payout.toFixed(2)}</td>
                          </tr>
                        ))}
                        {/* Totals row */}
                        <tr className="bg-[#0c101d] font-bold border-t-2 border-slate-700">
                          <td className="p-4 text-white uppercase text-xs">Total</td>
                          <td className="p-4"></td>
                          <td className="p-4 text-sm text-slate-300 text-right font-mono">{summary.total_hours.toFixed(2)}</td>
                          <td className="p-4 text-sm text-slate-300 text-right font-mono">${summary.total_base_pay.toFixed(2)}</td>
                          <td className="p-4 text-sm text-emerald-400 text-right font-mono">+${summary.total_extra_work.toFixed(2)}</td>
                          <td className="p-4 text-sm text-amber-400 text-right font-mono">-${summary.total_advances.toFixed(2)}</td>
                          <td className="p-4 text-base text-indigo-300 text-right font-mono bg-indigo-600/10">${summary.total_net_payout.toFixed(2)}</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* --- MODAL DIALOGS --- */}

      {/* 1. Add Employee Modal */}
      {showAddEmpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass max-w-md w-full p-6 rounded-3xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Onboard New Personnel</h3>
              <button 
                onClick={() => setShowAddEmpModal(false)}
                className="p-1 text-slate-400 hover:text-white transition-colors rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Alpha-Numeric ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EMP001"
                  value={newEmpId}
                  onChange={(e) => setNewEmpId(e.target.value.toUpperCase())}
                  className="w-full bg-[#111827] border border-slate-700 text-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Arjun Patel"
                  value={newEmpName}
                  onChange={(e) => setNewEmpName(e.target.value)}
                  className="w-full bg-[#111827] border border-slate-700 text-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Baseline Hour Rate ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={newEmpRate}
                  onChange={(e) => setNewEmpRate(Number(e.target.value))}
                  className="w-full bg-[#111827] border border-slate-700 text-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Operational Status</label>
                <div className="flex items-center space-x-4 mt-2">
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={newEmpStatus === true}
                      onChange={() => setNewEmpStatus(true)}
                      className="sr-only peer"
                    />
                    <span className="px-4 py-2 bg-slate-800 text-slate-400 peer-checked:bg-emerald-500/10 peer-checked:text-emerald-400 border border-slate-700 peer-checked:border-emerald-500/30 rounded-xl text-xs font-bold transition-all min-h-[44px] inline-flex items-center">
                      Active
                    </span>
                  </label>

                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={newEmpStatus === false}
                      onChange={() => setNewEmpStatus(false)}
                      className="sr-only peer"
                    />
                    <span className="px-4 py-2 bg-slate-800 text-slate-400 peer-checked:bg-rose-500/10 peer-checked:text-rose-400 border border-slate-700 peer-checked:border-rose-500/30 rounded-xl text-xs font-bold transition-all min-h-[44px] inline-flex items-center">
                      Inactive
                    </span>
                  </label>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddEmpModal(false)}
                  className="px-4 py-2.5 border border-slate-700 hover:border-slate-500 text-slate-300 font-bold rounded-xl text-sm transition-colors min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm transition-colors min-h-[44px]"
                >
                  Submit Registry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Edit Employee Modal */}
      {showEditEmpModal && currentEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass max-w-md w-full p-6 rounded-3xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Edit Employee Configuration</h3>
              <button 
                onClick={() => setShowEditEmpModal(false)}
                className="p-1 text-slate-400 hover:text-white transition-colors rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateEmployee} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Alpha-Numeric ID</label>
                <input
                  type="text"
                  disabled
                  value={currentEmp.employee_id}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-500 rounded-xl px-4 py-2.5 text-sm cursor-not-allowed min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={newEmpName}
                  onChange={(e) => setNewEmpName(e.target.value)}
                  className="w-full bg-[#111827] border border-slate-700 text-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Hourly Base Rate ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={newEmpRate}
                  onChange={(e) => setNewEmpRate(Number(e.target.value))}
                  className="w-full bg-[#111827] border border-slate-700 text-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Operational Status</label>
                <div className="flex items-center space-x-4 mt-2">
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="edit-status"
                      checked={newEmpStatus === true}
                      onChange={() => setNewEmpStatus(true)}
                      className="sr-only peer"
                    />
                    <span className="px-4 py-2 bg-slate-800 text-slate-400 peer-checked:bg-emerald-500/10 peer-checked:text-emerald-400 border border-slate-700 peer-checked:border-emerald-500/30 rounded-xl text-xs font-bold transition-all min-h-[44px] inline-flex items-center">
                      Active
                    </span>
                  </label>

                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="edit-status"
                      checked={newEmpStatus === false}
                      onChange={() => setNewEmpStatus(false)}
                      className="sr-only peer"
                    />
                    <span className="px-4 py-2 bg-slate-800 text-slate-400 peer-checked:bg-rose-500/10 peer-checked:text-rose-400 border border-slate-700 peer-checked:border-rose-500/30 rounded-xl text-xs font-bold transition-all min-h-[44px] inline-flex items-center">
                      Inactive
                    </span>
                  </label>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditEmpModal(false)}
                  className="px-4 py-2.5 border border-slate-700 hover:border-slate-500 text-slate-300 font-bold rounded-xl text-sm transition-colors min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm transition-colors min-h-[44px]"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Add Extra Work Tag Modal */}
      {showExtraWorkModal && activeAttendanceId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass max-w-md w-full p-6 rounded-3xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center">
                <Sparkles className="h-5 w-5 mr-2 text-indigo-400" />
                <span>Allocate Extra Work Extension</span>
              </h3>
              <button 
                onClick={() => setShowExtraWorkModal(false)}
                className="p-1 text-slate-400 hover:text-white transition-colors rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddExtraWork} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Standard Description Tag</label>
                <select
                  value={extraWorkTag}
                  onChange={(e) => setExtraWorkTag(e.target.value as any)}
                  className="w-full bg-[#111827] border border-slate-700 text-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
                >
                  <option value="Husk Packing">Husk Packing</option>
                  <option value="Rice delivery">Rice delivery</option>
                  <option value="Paddy">Paddy</option>
                  <option value="Custom">* Custom Tag Option</option>
                </select>
              </div>

              {extraWorkTag === 'Custom' && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Custom Description Label</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter custom deliverable description"
                    value={customTag}
                    onChange={(e) => setCustomTag(e.target.value)}
                    className="w-full bg-[#111827] border border-slate-700 text-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Flat Payout Amount ($)</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  required
                  value={extraWorkAmount}
                  onChange={(e) => setExtraWorkAmount(Number(e.target.value))}
                  className="w-full bg-[#111827] border border-slate-700 text-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Optional Details / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Bagged 40 sacks milling byproducts"
                  value={extraWorkDesc}
                  onChange={(e) => setExtraWorkDesc(e.target.value)}
                  className="w-full bg-[#111827] border border-slate-700 text-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
                />
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowExtraWorkModal(false)}
                  className="px-4 py-2.5 border border-slate-700 hover:border-slate-500 text-slate-300 font-bold rounded-xl text-sm transition-colors min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm transition-colors min-h-[44px]"
                >
                  Assign Bonus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Add Cash Advance Modal */}
      {showAdvanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass max-w-md w-full p-6 rounded-3xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-indigo-400" />
                <span>Document Cash Advance</span>
              </h3>
              <button 
                onClick={() => setShowAdvanceModal(false)}
                className="p-1 text-slate-400 hover:text-white transition-colors rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddAdvance} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Select Employee Recipient</label>
                <select
                  value={advEmployeeId || ""}
                  onChange={(e) => setAdvEmployeeId(Number(e.target.value))}
                  className="w-full bg-[#111827] border border-slate-700 text-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
                >
                  {employees.filter(e => e.is_active).map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.employee_id})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Date Issued</label>
                <input
                  type="date"
                  required
                  value={advDate}
                  onChange={(e) => setAdvDate(e.target.value)}
                  className="w-full bg-[#111827] border border-slate-700 text-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Advance Amount ($)</label>
                <input
                  type="number"
                  step="1"
                  min="5"
                  required
                  value={advAmount}
                  onChange={(e) => setAdvAmount(Number(e.target.value))}
                  className="w-full bg-[#111827] border border-slate-700 text-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Description Note</label>
                <input
                  type="text"
                  placeholder="e.g. Loan advance for transport fare"
                  value={advDesc}
                  onChange={(e) => setAdvDesc(e.target.value)}
                  className="w-full bg-[#111827] border border-slate-700 text-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
                />
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAdvanceModal(false)}
                  className="px-4 py-2.5 border border-slate-700 hover:border-slate-500 text-slate-300 font-bold rounded-xl text-sm transition-colors min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm transition-colors min-h-[44px]"
                >
                  Confirm Advance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
