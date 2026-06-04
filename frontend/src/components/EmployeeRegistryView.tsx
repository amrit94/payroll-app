import { Plus, ClipboardList, ChevronRight } from 'lucide-react';
import type { Employee } from '../types';

interface EmployeeRegistryViewProps {
  employees: Employee[];
  setSelectedReportEmployeeId: (id: number) => void;
  setActiveTab: (tab: 'dashboard' | 'attendance' | 'employees' | 'advances' | 'reports' | 'emp_reports') => void;
  setCurrentEmp: (emp: Employee) => void;
  setNewEmpName: (name: string) => void;
  setNewEmpRate: (rate: number) => void;
  setNewEmpStatus: (status: boolean) => void;
  setShowEditEmpModal: (show: boolean) => void;
  setShowAddEmpModal: (show: boolean) => void;
}

export default function EmployeeRegistryView({
  employees,
  setSelectedReportEmployeeId,
  setActiveTab,
  setCurrentEmp,
  setNewEmpName,
  setNewEmpRate,
  setNewEmpStatus,
  setShowEditEmpModal,
  setShowAddEmpModal,
}: EmployeeRegistryViewProps) {
  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Employee Registry</h2>
          <p className="text-sm text-slate-400">Configure profile-specific base pay structures and statuses.</p>
        </div>

        <button
          onClick={() => {
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
                <span className="text-xl font-extrabold text-white mt-1">₹{emp.hourly_rate.toFixed(2)}</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setSelectedReportEmployeeId(emp.id);
                    setActiveTab('emp_reports');
                  }}
                  className="inline-flex items-center space-x-1.5 px-3 py-2 bg-[#1e293b] hover:bg-[#334155] text-indigo-300 rounded-xl transition-all min-h-[44px]"
                  title="View Monthly Daily Entry Report"
                >
                  <ClipboardList className="h-4.5 w-4.5" />
                  <span className="text-xs font-bold">Logs</span>
                </button>

                <button
                  onClick={() => {
                    setCurrentEmp(emp);
                    setNewEmpName(emp.name);
                    setNewEmpRate(emp.hourly_rate);
                    setNewEmpStatus(emp.is_active);
                    setShowEditEmpModal(true);
                  }}
                  className="inline-flex items-center justify-center p-2 hover:bg-slate-800 rounded-xl border border-slate-700 hover:border-slate-500 text-slate-300 transition-colors min-h-[44px] min-w-[44px]"
                  title="Edit Configuration"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
