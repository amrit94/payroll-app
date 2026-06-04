import { FileSpreadsheet, FileText, Lock, Unlock } from 'lucide-react';
import type { MonthlySummary } from '../types';

interface MonthlySummaryViewProps {
  selectedMonth: string;
  summary: MonthlySummary | null;
  isCycleLocked: boolean;
  loading: boolean;
  handleLockCycle: () => void;
  handleExportExcel: () => void;
  handleExportPdf: () => void;
  setSelectedReportEmployeeId: (id: number) => void;
  setActiveTab: (tab: 'dashboard' | 'attendance' | 'employees' | 'advances' | 'reports' | 'emp_reports') => void;
}

export default function MonthlySummaryView({
  selectedMonth,
  summary,
  isCycleLocked,
  loading,
  handleLockCycle,
  handleExportExcel,
  handleExportPdf,
  setSelectedReportEmployeeId,
  setActiveTab,
}: MonthlySummaryViewProps) {
  return (
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
                      <td className="p-4 font-bold text-white">
                        <button
                          onClick={() => {
                            setSelectedReportEmployeeId(item.employee_db_id);
                            setActiveTab('emp_reports');
                          }}
                          className="hover:text-indigo-400 hover:underline text-left focus:outline-none font-bold min-h-[44px] flex items-center"
                        >
                          {item.name}
                        </button>
                      </td>
                      <td className="p-4 text-sm text-slate-300 text-right font-mono">{item.aggregate_hours.toFixed(2)}</td>
                      <td className="p-4 text-sm text-slate-300 text-right font-mono">₹{item.base_pay_subtotal.toFixed(2)}</td>
                      <td className="p-4 text-sm text-emerald-400 text-right font-mono">+₹{item.aggregated_extra_work.toFixed(2)}</td>
                      <td className="p-4 text-sm text-amber-400 text-right font-mono">-₹{item.advance_reductions.toFixed(2)}</td>
                      <td className="p-4 text-sm font-bold text-white text-right font-mono bg-indigo-500/5">₹{item.net_cash_payout.toFixed(2)}</td>
                    </tr>
                  ))}
                  {/* Summary totals footer */}
                  {summary && (
                    <tr className="bg-slate-900/40 border-t-2 border-slate-800 font-bold">
                      <td className="p-4 text-sm text-slate-400">TOTALS</td>
                      <td className="p-4"></td>
                      <td className="p-4 text-sm text-slate-300 text-right font-mono">{summary.total_hours.toFixed(2)}</td>
                      <td className="p-4 text-sm text-slate-300 text-right font-mono">₹{summary.total_base_pay.toFixed(2)}</td>
                      <td className="p-4 text-sm text-emerald-400 text-right font-mono">+₹{summary.total_extra_work.toFixed(2)}</td>
                      <td className="p-4 text-sm text-amber-400 text-right font-mono">-₹{summary.total_advances.toFixed(2)}</td>
                      <td className="p-4 text-base text-indigo-300 text-right font-mono bg-indigo-600/10">₹{summary.total_net_payout.toFixed(2)}</td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
