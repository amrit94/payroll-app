import { Plus, Lock, Trash } from 'lucide-react';
import type { CashAdvanceDetail, Employee } from '../types';

interface CashAdvancesLedgerViewProps {
  selectedMonth: string;
  isCycleLocked: boolean;
  loading: boolean;
  advances: CashAdvanceDetail[];
  employees: Employee[];
  handleDeleteAdvance: (advId: number) => void;
  setAdvEmployeeId: (id: number | null) => void;
  setAdvAmount: (amount: number) => void;
  setAdvDesc: (desc: string) => void;
  setShowAdvanceModal: (show: boolean) => void;
}

export default function CashAdvancesLedgerView({
  selectedMonth,
  isCycleLocked,
  loading,
  advances,
  employees,
  handleDeleteAdvance,
  setAdvEmployeeId,
  setAdvAmount,
  setAdvDesc,
  setShowAdvanceModal,
}: CashAdvancesLedgerViewProps) {
  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Financial Advance Ledger</h2>
          <p className="text-sm text-slate-400">Issue cash loans or advances. Reductions deduct negative metrics from monthly payouts.</p>
        </div>

        <button
          onClick={() => {
            setAdvEmployeeId(employees.filter(e => e.is_active)[0]?.id || null);
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
                    <td className="p-4 text-sm font-bold text-amber-400">-₹{adv.amount.toFixed(2)}</td>
                    <td className="p-4 text-sm text-slate-400">{adv.description || "N/A"}</td>
                    {!isCycleLocked && (
                      <td className="p-4">
                        <button
                          onClick={() => handleDeleteAdvance(adv.id)}
                          className="p-2 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-xl transition-colors min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
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
  );
}
