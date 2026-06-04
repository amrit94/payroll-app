import { 
  TrendingUp, 
  Calendar, 
  Sparkles, 
  Info, 
  Lock, 
  Unlock, 
  FileSpreadsheet, 
  FileText 
} from 'lucide-react';
import type { MonthlySummary } from '../types';

interface DashboardViewProps {
  selectedMonth: string;
  summary: MonthlySummary | null;
  isCycleLocked: boolean;
  handleLockCycle: () => void;
  handleExportExcel: () => void;
  handleExportPdf: () => void;
}

export default function DashboardView({
  selectedMonth,
  summary,
  isCycleLocked,
  handleLockCycle,
  handleExportExcel,
  handleExportPdf,
}: DashboardViewProps) {
  return (
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
          <p className="text-3xl font-extrabold text-white mt-2">₹{summary?.total_net_payout.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) || "0.00"}</p>
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
          <p className="text-3xl font-extrabold text-white mt-2">₹{summary?.total_extra_work.toLocaleString(undefined, {minimumFractionDigits: 2}) || "0.00"}</p>
          <div className="mt-3 text-xs text-emerald-400 font-semibold flex items-center">
            <Sparkles className="h-3 w-3 mr-1" /> Standard flat-rate deliverable payouts
          </div>
        </div>

        <div className="glass p-5 rounded-3xl relative overflow-hidden">
          <div className="absolute right-0 top-0 h-24 w-24 bg-amber-500/5 rounded-full blur-xl"></div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Advances Issued</p>
          <p className="text-3xl font-extrabold text-amber-300 mt-2">-₹{summary?.total_advances.toLocaleString(undefined, {minimumFractionDigits: 2}) || "0.00"}</p>
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
  );
}
