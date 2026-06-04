import { FileSpreadsheet, FileText } from 'lucide-react';
import type { Employee } from '../types';

interface EmployeeDailyLogsViewProps {
  employees: Employee[];
  selectedReportEmployeeId: number | null;
  setSelectedReportEmployeeId: (id: number | null) => void;
  reportLoading: boolean;
  employeeReport: any | null;
  handleExportEmployeeExcel: () => void;
  handleExportEmployeePdf: () => void;
}

export default function EmployeeDailyLogsView({
  employees,
  selectedReportEmployeeId,
  setSelectedReportEmployeeId,
  reportLoading,
  employeeReport,
  handleExportEmployeeExcel,
  handleExportEmployeePdf,
}: EmployeeDailyLogsViewProps) {
  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Employee Daily Logs</h2>
          <p className="text-sm text-slate-400">Detailed month-level attendance, daily earnings, and adjustments tracker.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Employee Selection Control */}
          <div className="flex items-center space-x-3 bg-slate-900/50 p-2 rounded-2xl border border-slate-800">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">Personnel:</label>
            <select
              value={selectedReportEmployeeId || ""}
              onChange={(e) => setSelectedReportEmployeeId(Number(e.target.value))}
              className="bg-[#111827] border border-slate-700 text-slate-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px] min-w-[200px]"
            >
              <option value="" disabled>-- Select Employee --</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.employee_id})
                </option>
              ))}
            </select>
          </div>

          {/* Exporter Controls */}
          {selectedReportEmployeeId && employeeReport && (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleExportEmployeeExcel}
                className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl transition-colors min-h-[44px]"
                title="Download Excel Report"
              >
                <FileSpreadsheet className="h-5 w-5" />
                <span className="hidden md:inline">Excel</span>
              </button>

              <button
                onClick={handleExportEmployeePdf}
                className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl transition-colors min-h-[44px]"
                title="Download PDF Report"
              >
                <FileText className="h-5 w-5" />
                <span className="hidden md:inline">PDF</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {reportLoading ? (
        <div className="glass p-12 text-center text-slate-400 rounded-3xl">
          Compiling day-by-day logs for the selected individual...
        </div>
      ) : !employeeReport ? (
        <div className="glass p-12 text-center text-slate-400 rounded-3xl">
          Please select an active employee from the dropdown list to pull their ledger.
        </div>
      ) : (
        <>
          {/* Individual statistics panels */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
            <div className="glass p-5 rounded-3xl relative overflow-hidden">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Base Pay Rate</span>
              <div className="text-2xl font-extrabold text-white mt-1.5 font-mono">
                ₹{employeeReport.hourly_rate.toFixed(2)}/hr
              </div>
            </div>

            <div className="glass p-5 rounded-3xl relative overflow-hidden">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Total Present</span>
              <div className="text-2xl font-extrabold text-cyan-400 mt-1.5 font-mono">
                {employeeReport.days.filter((day: any) => day.status === 'Present').length} Days
              </div>
            </div>

            <div className="glass p-5 rounded-3xl relative overflow-hidden">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Hours Logged</span>
              <div className="text-2xl font-extrabold text-indigo-400 mt-1.5 font-mono">
                {employeeReport.total_hours.toFixed(2)} hrs
              </div>
            </div>

            <div className="glass p-5 rounded-3xl relative overflow-hidden">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Base Pay Subtotal</span>
              <div className="text-2xl font-extrabold text-slate-300 mt-1.5 font-mono">
                ₹{employeeReport.total_base_pay.toFixed(2)}
              </div>
            </div>

            <div className="glass p-5 rounded-3xl relative overflow-hidden">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Extra Work Bonuses</span>
              <div className="text-2xl font-extrabold text-emerald-400 mt-1.5 font-mono">
                +₹{employeeReport.total_extra_work.toFixed(2)}
              </div>
            </div>

            <div className="glass p-5 rounded-3xl relative overflow-hidden">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Cash Advances</span>
              <div className="text-2xl font-extrabold text-amber-400 mt-1.5 font-mono">
                -₹{employeeReport.total_advances.toFixed(2)}
              </div>
            </div>

            <div className="glass p-5 rounded-3xl relative overflow-hidden bg-indigo-900/15 border border-indigo-500/20">
              <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Net Monthly Payout</span>
              <div className="text-2xl font-extrabold text-white mt-1.5 font-mono">
                ₹{employeeReport.total_net_payout.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Day-by-day table */}
          <div className="glass rounded-3xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-[#0c101d]">
                    <th className="p-4 text-xs uppercase font-bold text-slate-400 tracking-wider">Calendar Date</th>
                    <th className="p-4 text-xs uppercase font-bold text-slate-400 tracking-wider">Status</th>
                    <th className="p-4 text-xs uppercase font-bold text-slate-400 tracking-wider text-right">Hours Logged</th>
                    <th className="p-4 text-xs uppercase font-bold text-slate-400 tracking-wider text-right">Hourly Rate</th>
                    <th className="p-4 text-xs uppercase font-bold text-slate-400 tracking-wider text-right">Base Earnings</th>
                    <th className="p-4 text-xs uppercase font-bold text-slate-400 tracking-wider">Extra Work Tasks</th>
                    <th className="p-4 text-xs uppercase font-bold text-slate-400 tracking-wider">Cash Advances</th>
                    <th className="p-4 text-xs uppercase font-bold text-slate-400 tracking-wider text-right">Net Daily Payout</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {employeeReport.days.map((day: any) => (
                    <tr key={day.date} className="hover:bg-slate-900/20 transition-colors">
                      <td className="p-4 font-mono text-sm text-slate-300">
                        {new Date(day.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: '2-digit',
                          weekday: 'short',
                          timeZone: 'UTC'
                        })}
                      </td>
                      <td className="p-4">
                        {day.status === "Present" ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Present
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400">
                            Absent
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-sm text-slate-300 text-right font-mono">
                        {day.status === "Present" ? `${day.hours_logged.toFixed(2)} hrs` : "-"}
                      </td>
                      <td className="p-4 text-sm text-slate-400 text-right font-mono">
                        ₹{day.base_rate.toFixed(2)}
                      </td>
                      <td className="p-4 text-sm text-slate-300 text-right font-mono">
                        ₹{day.base_pay.toFixed(2)}
                      </td>
                      <td className="p-4 text-sm">
                        {day.extra_work_items.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {day.extra_work_items.map((item: any, idx: number) => (
                              <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/15" title={item.description}>
                                {item.tag} (+₹{item.amount.toFixed(2)})
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-600 text-xs">-</span>
                        )}
                      </td>
                      <td className="p-4 text-sm">
                        {day.advance_items.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {day.advance_items.map((item: any, idx: number) => (
                              <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/15" title={item.description}>
                                Loan (-₹{item.amount.toFixed(2)})
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-600 text-xs">-</span>
                        )}
                      </td>
                      <td className="p-4 text-sm font-bold text-white text-right font-mono">
                        ₹{day.net_pay.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
