
import { 
  Sparkles, 
  Menu, 
  X, 
  TrendingUp, 
  CalendarDays, 
  Users, 
  IndianRupee, 
  FileText, 
  ClipboardList, 
  Lock, 
  Unlock,
  Wheat
} from 'lucide-react';

interface SidebarProps {
  activeTab: 'dashboard' | 'attendance' | 'employees' | 'advances' | 'reports' | 'emp_reports' | 'paddy_vendors' | 'paddy_compare';
  setActiveTab: (tab: 'dashboard' | 'attendance' | 'employees' | 'advances' | 'reports' | 'emp_reports' | 'paddy_vendors' | 'paddy_compare') => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  isCycleLocked: boolean;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  mobileMenuOpen,
  setMobileMenuOpen,
  selectedMonth,
  setSelectedMonth,
  isCycleLocked,
}: SidebarProps) {
  return (
    <aside className="w-full md:w-68 md:h-screen md:sticky md:top-0 bg-[#0d121f] border-b md:border-b-0 md:border-r border-slate-800 flex flex-col">
      {/* Brand header */}
      <div className="p-4 md:p-6 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-xl shadow-lg shadow-indigo-500/20">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-base md:text-lg font-bold tracking-tight text-white m-0">Payroll Ledger</h1>
            <p className="text-[10px] text-indigo-400 font-medium uppercase tracking-wider">SuperAdmin Hub</p>
          </div>
        </div>
        {/* Hamburger toggle button for mobile */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-slate-400 hover:text-white focus:outline-none min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-800/30 border border-slate-700/50 hover:bg-slate-850"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Collapsible area on mobile */}
      <div className={`${mobileMenuOpen ? 'flex' : 'hidden'} md:flex flex-col flex-1`}>
        {/* Navigation list */}
        <nav className="flex-1 p-4 space-y-1">
          <button
            onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
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
            onClick={() => { setActiveTab('attendance'); setMobileMenuOpen(false); }}
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
            onClick={() => { setActiveTab('employees'); setMobileMenuOpen(false); }}
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
            onClick={() => { setActiveTab('advances'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 text-left min-h-[44px] ${
              activeTab === 'advances'
                ? 'bg-gradient-to-r from-indigo-600/20 to-violet-600/10 text-indigo-300 border-l-4 border-indigo-500 font-medium'
                : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
            }`}
          >
            <IndianRupee className="h-5 w-5" />
            <span>Cash Advances</span>
          </button>
          
          <button
            onClick={() => { setActiveTab('reports'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 text-left min-h-[44px] ${
              activeTab === 'reports'
                ? 'bg-gradient-to-r from-indigo-600/20 to-violet-600/10 text-indigo-300 border-l-4 border-indigo-500 font-medium'
                : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
            }`}
          >
            <FileText className="h-5 w-5" />
            <span>Lock & Export</span>
          </button>

          <button
            onClick={() => { setActiveTab('emp_reports'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 text-left min-h-[44px] ${
              activeTab === 'emp_reports'
                ? 'bg-gradient-to-r from-indigo-600/20 to-violet-600/10 text-indigo-300 border-l-4 border-indigo-500 font-medium'
                : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
            }`}
          >
            <ClipboardList className="h-5 w-5" />
            <span>Employee Daily Logs</span>
          </button>

          <button
            onClick={() => { setActiveTab('paddy_vendors'); setMobileMenuOpen(false); }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 text-left min-h-[44px] ${
              activeTab === 'paddy_vendors' || activeTab === 'paddy_compare'
                ? 'bg-gradient-to-r from-indigo-600/20 to-violet-600/10 text-indigo-300 border-l-4 border-indigo-500 font-medium'
                : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
            }`}
          >
            <Wheat className="h-5 w-5" />
            <span>Paddy Procurement</span>
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
      </div>
    </aside>
  );
}
