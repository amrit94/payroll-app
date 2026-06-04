import type React from 'react';
import { X, Sparkles, IndianRupee } from 'lucide-react';
import type { Employee } from '../types';

// ==========================================
// 1. ADD EMPLOYEE MODAL
// ==========================================
interface AddEmployeeModalProps {
  show: boolean;
  onClose: () => void;
  newEmpId: string;
  setNewEmpId: (id: string) => void;
  newEmpName: string;
  setNewEmpName: (name: string) => void;
  newEmpRate: number;
  setNewEmpRate: (rate: number) => void;
  newEmpStatus: boolean;
  setNewEmpStatus: (status: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function AddEmployeeModal({
  show,
  onClose,
  newEmpId,
  setNewEmpId,
  newEmpName,
  setNewEmpName,
  newEmpRate,
  setNewEmpRate,
  newEmpStatus,
  setNewEmpStatus,
  onSubmit,
}: AddEmployeeModalProps) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass max-w-md w-full p-6 rounded-3xl space-y-4 animate-scale-in">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white">Onboard New Personnel</h3>
          <button 
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white transition-colors rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
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
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Baseline Hour Rate (₹)</label>
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
              onClick={onClose}
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
  );
}

// ==========================================
// 2. EDIT EMPLOYEE MODAL
// ==========================================
interface EditEmployeeModalProps {
  show: boolean;
  onClose: () => void;
  currentEmp: Employee | null;
  newEmpName: string;
  setNewEmpName: (name: string) => void;
  newEmpRate: number;
  setNewEmpRate: (rate: number) => void;
  newEmpStatus: boolean;
  setNewEmpStatus: (status: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function EditEmployeeModal({
  show,
  onClose,
  currentEmp,
  newEmpName,
  setNewEmpName,
  newEmpRate,
  setNewEmpRate,
  newEmpStatus,
  setNewEmpStatus,
  onSubmit,
}: EditEmployeeModalProps) {
  if (!show || !currentEmp) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass max-w-md w-full p-6 rounded-3xl space-y-4 animate-scale-in">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white">Edit Employee Configuration</h3>
          <button 
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white transition-colors rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
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
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Hourly Base Rate (₹)</label>
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
              onClick={onClose}
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
  );
}

// ==========================================
// 3. ADD EXTRA WORK MODAL
// ==========================================
interface AddExtraWorkModalProps {
  show: boolean;
  onClose: () => void;
  extraWorkTag: 'Husk Packing' | 'Rice delivery' | 'Paddy' | 'Custom';
  setExtraWorkTag: (tag: 'Husk Packing' | 'Rice delivery' | 'Paddy' | 'Custom') => void;
  customTag: string;
  setCustomTag: (tag: string) => void;
  extraWorkAmount: number;
  setExtraWorkAmount: (amount: number) => void;
  extraWorkDesc: string;
  setExtraWorkDesc: (desc: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function AddExtraWorkModal({
  show,
  onClose,
  extraWorkTag,
  setExtraWorkTag,
  customTag,
  setCustomTag,
  extraWorkAmount,
  setExtraWorkAmount,
  extraWorkDesc,
  setExtraWorkDesc,
  onSubmit,
}: AddExtraWorkModalProps) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass max-w-md w-full p-6 rounded-3xl space-y-4 animate-scale-in">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white flex items-center">
            <Sparkles className="h-5 w-5 mr-2 text-indigo-400" />
            <span>Allocate Extra Work Extension</span>
          </h3>
          <button 
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white transition-colors rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
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
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Flat Payout Amount (₹)</label>
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
              onClick={onClose}
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
  );
}

// ==========================================
// 4. DOCUMENT CASH ADVANCE MODAL
// ==========================================
interface AddAdvanceModalProps {
  show: boolean;
  onClose: () => void;
  employees: Employee[];
  advEmployeeId: number | null;
  setAdvEmployeeId: (id: number | null) => void;
  advDate: string;
  setAdvDate: (date: string) => void;
  advAmount: number;
  setAdvAmount: (amount: number) => void;
  advDesc: string;
  setAdvDesc: (desc: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function AddAdvanceModal({
  show,
  onClose,
  employees,
  advEmployeeId,
  setAdvEmployeeId,
  advDate,
  setAdvDate,
  advAmount,
  setAdvAmount,
  advDesc,
  setAdvDesc,
  onSubmit,
}: AddAdvanceModalProps) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass max-w-md w-full p-6 rounded-3xl space-y-4 animate-scale-in">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white flex items-center">
            <IndianRupee className="h-5 w-5 mr-2 text-indigo-400" />
            <span>Document Cash Advance</span>
          </h3>
          <button 
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white transition-colors rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Select Employee Recipient</label>
            <select
              value={advEmployeeId || ""}
              onChange={(e) => setAdvEmployeeId(Number(e.target.value))}
              className="w-full bg-[#111827] border border-slate-700 text-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
            >
              <option value="" disabled>-- Select Employee --</option>
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
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Advance Amount (₹)</label>
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
              onClick={onClose}
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
  );
}
