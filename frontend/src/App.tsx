import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertTriangle, Check } from 'lucide-react';
import { API_BASE_URL } from './config';
// Import Types
import type { Employee, Attendance, CashAdvanceDetail, MonthlySummary, ActivityLog } from './types';

// Import Components
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import AttendanceLedgerView from './components/AttendanceLedgerView';
import EmployeeRegistryView from './components/EmployeeRegistryView';
import CashAdvancesLedgerView from './components/CashAdvancesLedgerView';
import MonthlySummaryView from './components/MonthlySummaryView';
import EmployeeDailyLogsView from './components/EmployeeDailyLogsView';
import ActivitySidebar from './components/ActivitySidebar';
import { 
  AddEmployeeModal, 
  EditEmployeeModal, 
  AddExtraWorkModal, 
  AddAdvanceModal 
} from './components/Modals';
export default function App() {
  // Navigation & Date contexts
  const getTabFromHash = (): 'dashboard' | 'attendance' | 'employees' | 'advances' | 'reports' | 'emp_reports' => {
    const hash = window.location.hash.replace('#/', '');
    if (['dashboard', 'attendance', 'employees', 'advances', 'reports', 'emp_reports'].includes(hash)) {
      return hash as any;
    }
    return 'dashboard';
  };

  const [activeTab, setActiveTab] = useState<'dashboard' | 'attendance' | 'employees' | 'advances' | 'reports' | 'emp_reports'>(getTabFromHash());
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    window.location.hash = `#/${activeTab}`;
  }, [activeTab]);

  useEffect(() => {
    const handleHashChange = () => {
      const tab = getTabFromHash();
      setActiveTab(tab);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().substring(0, 7)); // YYYY-MM
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().substring(0, 10)); // YYYY-MM-DD
  const [isCycleLocked, setIsCycleLocked] = useState<boolean>(false);

  // Sync selectedDate when selectedMonth changes
  useEffect(() => {
    const currentYearMonth = selectedDate.substring(0, 7);
    if (currentYearMonth !== selectedMonth) {
      const day = parseInt(selectedDate.substring(8, 10), 10);
      const [yearStr, monthStr] = selectedMonth.split('-');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);
      const lastDayOfNewMonth = new Date(year, month, 0).getDate();
      const newDay = Math.min(day, lastDayOfNewMonth);
      const newDayStr = String(newDay).padStart(2, '0');
      setSelectedDate(`${selectedMonth}-${newDayStr}`);
    }
  }, [selectedMonth]);

  // Sync selectedMonth when selectedDate changes
  useEffect(() => {
    const currentYearMonth = selectedDate.substring(0, 7);
    if (currentYearMonth !== selectedMonth) {
      setSelectedMonth(currentYearMonth);
    }
  }, [selectedDate]);

  // Employee Daily report states
  const [selectedReportEmployeeId, setSelectedReportEmployeeId] = useState<number | null>(null);
  const [employeeReport, setEmployeeReport] = useState<any | null>(null);
  const [reportLoading, setReportLoading] = useState<boolean>(false);

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

  // Live Audit Mutation Logs State
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  const addMutationLog = (message: string, action: ActivityLog['action'], entity: ActivityLog['entity']) => {
    if (action === 'ERROR') {
      const newLog: ActivityLog = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        action,
        entity,
        message
      };
      setActivityLogs(prev => [newLog, ...prev]);
    } else {
      fetchAuditLogs();
    }
  };

  // Fetch initial data & react to context changes
  useEffect(() => {
    fetchEmployees();
    fetchAuditLogs();
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

  useEffect(() => {
    if (activeTab === 'emp_reports' && selectedReportEmployeeId) {
      fetchEmployeeReport(selectedReportEmployeeId, selectedMonth);
    }
  }, [activeTab, selectedReportEmployeeId, selectedMonth]);

  useEffect(() => {
    if (employees.length > 0 && selectedReportEmployeeId === null) {
      setSelectedReportEmployeeId(employees[0].id);
    }
  }, [employees, selectedReportEmployeeId]);

  const fetchEmployeeReport = async (empId: number, monthStr: string) => {
    try {
      setReportLoading(true);
      setErrorMsg(null);
      const res = await axios.get(`${API_BASE_URL}/api/employees/${empId}/attendance?month=${monthStr}`);
      setEmployeeReport(res.data);
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Could not fetch employee report.", true);
      setEmployeeReport(null);
    } finally {
      setReportLoading(false);
    }
  };

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

  const fetchAuditLogs = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/audit-logs`);
      const formattedLogs: ActivityLog[] = res.data.map((log: any) => {
        const parsedDate = new Date(log.timestamp.endsWith('Z') ? log.timestamp : log.timestamp + 'Z');
        return {
          id: String(log.id),
          action: log.action,
          entity: log.entity,
          message: log.message,
          timestamp: parsedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        };
      });
      setActivityLogs(formattedLogs);
    } catch (err) {
      console.error("Failed to fetch audit logs", err);
    }
  };

  const handleClearLogs = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/api/audit-logs`);
      fetchAuditLogs();
    } catch (err) {
      showToast("Failed to clear audit logs in database", true);
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
      addMutationLog(`Onboarded employee '${newEmpName}' (${newEmpId}) with hourly rate ₹${newEmpRate.toFixed(2)}`, 'CREATE', 'Employee');
      setShowAddEmpModal(false);
      // Reset state
      setNewEmpId('');
      setNewEmpName('');
      setNewEmpRate(20);
      setNewEmpStatus(true);
      fetchEmployees();
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || "Error onboarding employee";
      showToast(errMsg, true);
      addMutationLog(`Failed to onboard employee '${newEmpName}': ${errMsg}`, 'ERROR', 'Employee');
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
      addMutationLog(`Updated profile config for '${newEmpName}' (${currentEmp.employee_id})`, 'UPDATE', 'Employee');
      setShowEditEmpModal(false);
      setCurrentEmp(null);
      fetchEmployees();
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || "Error updating employee profile";
      showToast(errMsg, true);
      addMutationLog(`Failed to update employee '${newEmpName}': ${errMsg}`, 'ERROR', 'Employee');
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
      const emp = employees.find(e => e.id === employeeId);
      const empName = emp ? emp.name : `ID ${employeeId}`;
      const empUid = emp ? emp.employee_id : '';
      const actionMsg = hoursNum === null ? "set Absent" : `set to ${hoursNum.toFixed(2)} hrs`;
      addMutationLog(`Recorded attendance for ${empName} (${empUid}): ${actionMsg} on ${selectedDate}`, 'UPDATE', 'Attendance');
      // Soft refresh local attendance array
      fetchAttendance(selectedDate);
    } catch (err: any) {
      const emp = employees.find(e => e.id === employeeId);
      const empName = emp ? emp.name : `ID ${employeeId}`;
      const errMsg = err.response?.data?.detail || "Error recording hours. Check lock state.";
      showToast(errMsg, true);
      addMutationLog(`Failed to update attendance for ${empName}: ${errMsg}`, 'ERROR', 'Attendance');
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
      const targetAtt = attendance.find(a => a.id === activeAttendanceId);
      const empName = targetAtt ? targetAtt.employee.name : 'Unknown';
      addMutationLog(`Allocated '${finalTag}' tag bonus (+₹${extraWorkAmount}) for ${empName} on ${selectedDate}`, 'CREATE', 'Attendance');
      setShowExtraWorkModal(false);
      fetchAttendance(selectedDate);
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || "Failed to append extra work tag. Verify present status.";
      showToast(errMsg, true);
      addMutationLog(`Failed to allocate extra work bonus: ${errMsg}`, 'ERROR', 'Attendance');
    }
  };

  const handleDeleteExtraWork = async (extraId: number) => {
    if (window.confirm("Are you sure you want to remove this extra work assignment?")) {
      try {
        await axios.delete(`${API_BASE_URL}/api/attendance/extra-work/${extraId}`);
        showToast("Extra work bonus removed.");
        addMutationLog(`Removed extra work tag bonus allocation ID ${extraId}`, 'DELETE', 'Attendance');
        fetchAttendance(selectedDate);
      } catch (err: any) {
        const errMsg = err.response?.data?.detail || "Failed to delete extra work record";
        showToast(errMsg, true);
        addMutationLog(`Failed to delete extra work bonus ID ${extraId}: ${errMsg}`, 'ERROR', 'Attendance');
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
      const emp = employees.find(e => e.id === advEmployeeId);
      const empName = emp ? emp.name : `ID ${advEmployeeId}`;
      addMutationLog(`Issued ₹${advAmount.toFixed(2)} cash advance to ${empName} on ${advDate}`, 'CREATE', 'Cash Advance');
      setShowAdvanceModal(false);
      // Reset forms
      setAdvAmount(0);
      setAdvDesc('');
      fetchAdvances(selectedMonth);
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || "Failed to register advance. Month may be locked.";
      showToast(errMsg, true);
      addMutationLog(`Failed to issue cash advance: ${errMsg}`, 'ERROR', 'Cash Advance');
    }
  };

  const handleDeleteAdvance = async (advId: number) => {
    if (window.confirm("Are you sure you want to void this cash advance?")) {
      try {
        await axios.delete(`${API_BASE_URL}/api/advances/${advId}`);
        showToast("Advance transaction voided.");
        addMutationLog(`Voided cash advance transaction record ID ${advId}`, 'DELETE', 'Cash Advance');
        fetchAdvances(selectedMonth);
      } catch (err: any) {
        const errMsg = err.response?.data?.detail || "Failed to delete cash advance";
        showToast(errMsg, true);
        addMutationLog(`Failed to void cash advance ID ${advId}: ${errMsg}`, 'ERROR', 'Cash Advance');
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
        addMutationLog(`Finalized and locked payroll cycle for month cycle ${selectedMonth}`, 'LOCK', 'Cycle');
        setIsCycleLocked(true);
        fetchSummary(selectedMonth);
      } catch (err: any) {
        const errMsg = err.response?.data?.detail || "Failed to lock cycle";
        showToast(errMsg, true);
        addMutationLog(`Failed to lock cycle ${selectedMonth}: ${errMsg}`, 'LOCK', 'Cycle');
      }
    }
  };

  const handleExportExcel = () => {
    window.open(`${API_BASE_URL}/api/reports/excel?month=${selectedMonth}`);
  };

  const handleExportPdf = () => {
    window.open(`${API_BASE_URL}/api/reports/pdf?month=${selectedMonth}`);
  };

  const handleExportEmployeeExcel = () => {
    if (selectedReportEmployeeId) {
      window.open(`${API_BASE_URL}/api/employees/${selectedReportEmployeeId}/attendance/excel?month=${selectedMonth}`);
    }
  };

  const handleExportEmployeePdf = () => {
    if (selectedReportEmployeeId) {
      window.open(`${API_BASE_URL}/api/employees/${selectedReportEmployeeId}/attendance/pdf?month=${selectedMonth}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#080b11] text-slate-100 font-sans">
      
      {/* SIDEBAR NAVIGATION */}
      <Sidebar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        isCycleLocked={isCycleLocked}
      />

      {/* MAIN CONTAINER */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        
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
          <DashboardView 
            selectedMonth={selectedMonth}
            summary={summary}
            isCycleLocked={isCycleLocked}
            handleLockCycle={handleLockCycle}
            handleExportExcel={handleExportExcel}
            handleExportPdf={handleExportPdf}
          />
        )}

        {/* 2. ATTENDANCE ENTRY LEDGER */}
        {activeTab === 'attendance' && (
          <AttendanceLedgerView 
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            isCycleLocked={isCycleLocked}
            loading={loading}
            attendance={attendance}
            handleAttendanceChange={handleAttendanceChange}
            handleDeleteExtraWork={handleDeleteExtraWork}
            handleOpenExtraWork={handleOpenExtraWork}
          />
        )}

        {/* 3. EMPLOYEE REGISTRY */}
        {activeTab === 'employees' && (
          <EmployeeRegistryView 
            employees={employees}
            setSelectedReportEmployeeId={setSelectedReportEmployeeId}
            setActiveTab={setActiveTab}
            setCurrentEmp={setCurrentEmp}
            setNewEmpName={setNewEmpName}
            setNewEmpRate={setNewEmpRate}
            setNewEmpStatus={setNewEmpStatus}
            setShowEditEmpModal={setShowEditEmpModal}
            setShowAddEmpModal={setShowAddEmpModal}
          />
        )}

        {/* 4. CASH ADVANCES LEDGER */}
        {activeTab === 'advances' && (
          <CashAdvancesLedgerView 
            selectedMonth={selectedMonth}
            isCycleLocked={isCycleLocked}
            loading={loading}
            advances={advances}
            employees={employees}
            handleDeleteAdvance={handleDeleteAdvance}
            setAdvEmployeeId={setAdvEmployeeId}
            setAdvAmount={setAdvAmount}
            setAdvDesc={setAdvDesc}
            setShowAdvanceModal={setShowAdvanceModal}
          />
        )}

        {/* 5. LOCK & EXPORTS (MONTHLY COMPENSATION AGGREGATION) */}
        {activeTab === 'reports' && (
          <MonthlySummaryView 
            selectedMonth={selectedMonth}
            summary={summary}
            isCycleLocked={isCycleLocked}
            loading={loading}
            handleLockCycle={handleLockCycle}
            handleExportExcel={handleExportExcel}
            handleExportPdf={handleExportPdf}
            setSelectedReportEmployeeId={setSelectedReportEmployeeId}
            setActiveTab={setActiveTab}
          />
        )}

        {/* 6. EMPLOYEE MONTHLY DRILL-DOWN REPORT */}
        {activeTab === 'emp_reports' && (
          <EmployeeDailyLogsView 
            employees={employees}
            selectedReportEmployeeId={selectedReportEmployeeId}
            setSelectedReportEmployeeId={setSelectedReportEmployeeId}
            reportLoading={reportLoading}
            employeeReport={employeeReport}
            handleExportEmployeeExcel={handleExportEmployeeExcel}
            handleExportEmployeePdf={handleExportEmployeePdf}
          />
        )}

      </main>

      {/* RIGHT AUDIT SIDEBAR */}
      <ActivitySidebar 
        logs={activityLogs} 
        onClearLogs={handleClearLogs} 
      />

      {/* --- MODAL DIALOGS --- */}

      {/* 1. Add Employee Modal */}
      <AddEmployeeModal 
        show={showAddEmpModal}
        onClose={() => setShowAddEmpModal(false)}
        newEmpId={newEmpId}
        setNewEmpId={setNewEmpId}
        newEmpName={newEmpName}
        setNewEmpName={setNewEmpName}
        newEmpRate={newEmpRate}
        setNewEmpRate={setNewEmpRate}
        newEmpStatus={newEmpStatus}
        setNewEmpStatus={setNewEmpStatus}
        onSubmit={handleAddEmployee}
      />

      {/* 2. Edit Employee Modal */}
      <EditEmployeeModal 
        show={showEditEmpModal}
        onClose={() => {
          setShowEditEmpModal(false);
          setCurrentEmp(null);
        }}
        currentEmp={currentEmp}
        newEmpName={newEmpName}
        setNewEmpName={setNewEmpName}
        newEmpRate={newEmpRate}
        setNewEmpRate={setNewEmpRate}
        newEmpStatus={newEmpStatus}
        setNewEmpStatus={setNewEmpStatus}
        onSubmit={handleUpdateEmployee}
      />

      {/* 3. Add Extra Work Tag Modal */}
      <AddExtraWorkModal 
        show={showExtraWorkModal}
        onClose={() => setShowExtraWorkModal(false)}
        extraWorkTag={extraWorkTag}
        setExtraWorkTag={setExtraWorkTag}
        customTag={customTag}
        setCustomTag={setCustomTag}
        extraWorkAmount={extraWorkAmount}
        setExtraWorkAmount={setExtraWorkAmount}
        extraWorkDesc={extraWorkDesc}
        setExtraWorkDesc={setExtraWorkDesc}
        onSubmit={handleAddExtraWork}
      />

      {/* 4. Add Cash Advance Modal */}
      <AddAdvanceModal 
        show={showAdvanceModal}
        onClose={() => setShowAdvanceModal(false)}
        employees={employees}
        advEmployeeId={advEmployeeId}
        setAdvEmployeeId={setAdvEmployeeId}
        advDate={advDate}
        setAdvDate={setAdvDate}
        advAmount={advAmount}
        setAdvAmount={setAdvAmount}
        advDesc={advDesc}
        setAdvDesc={setAdvDesc}
        onSubmit={handleAddAdvance}
      />
    </div>
  );
}
