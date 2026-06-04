import { Lock, Plus, X } from 'lucide-react';
import type { Attendance } from '../types';

interface AttendanceLedgerViewProps {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  isCycleLocked: boolean;
  loading: boolean;
  attendance: Attendance[];
  handleAttendanceChange: (employeeId: number, hours: string) => void;
  handleDeleteExtraWork: (extraId: number) => void;
  handleOpenExtraWork: (attId: number) => void;
}

export default function AttendanceLedgerView({
  selectedDate,
  setSelectedDate,
  isCycleLocked,
  loading,
  attendance,
  handleAttendanceChange,
  handleDeleteExtraWork,
  handleOpenExtraWork,
}: AttendanceLedgerViewProps) {
  return (
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
                      <td className="p-4 text-sm text-indigo-300 font-semibold">₹{log.employee.hourly_rate.toFixed(2)}/hr</td>
                      
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
                        ₹{wage.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </td>

                      {/* Extra Work tags */}
                      <td className="p-4 space-y-2">
                        {isPresent ? (
                          <>
                            <div className="flex flex-wrap gap-2 items-center">
                              {log.extra_work.map((extra) => (
                                <span key={extra.id} className="inline-flex items-center px-2.5 py-1 bg-indigo-500/10 text-indigo-300 text-xs font-bold rounded-xl border border-indigo-500/20">
                                  <b>{extra.tag}</b>: ₹{extra.amount.toFixed(2)}
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
  );
}
