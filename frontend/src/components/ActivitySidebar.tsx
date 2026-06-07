import React, { useState } from 'react';
import { 
  History, 
  Trash2, 
  PlusCircle, 
  Edit3, 
  MinusCircle, 
  Lock, 
  AlertTriangle 
} from 'lucide-react';
import type { ActivityLog } from '../types';

interface ActivitySidebarProps {
  logs: ActivityLog[];
  onClearLogs: () => void;
}

export default function ActivitySidebar({ logs, onClearLogs }: ActivitySidebarProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getActionIcon = (action: ActivityLog['action']) => {
    switch (action) {
      case 'CREATE':
        return <PlusCircle className="h-4 w-4 text-emerald-400 flex-shrink-0" />;
      case 'UPDATE':
        return <Edit3 className="h-4 w-4 text-indigo-400 flex-shrink-0" />;
      case 'DELETE':
        return <MinusCircle className="h-4 w-4 text-rose-400 flex-shrink-0" />;
      case 'LOCK':
        return <Lock className="h-4 w-4 text-amber-400 flex-shrink-0" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-rose-400 flex-shrink-0" />;
    }
  };

  const getActionBadgeClass = (action: ActivityLog['action']) => {
    switch (action) {
      case 'CREATE':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'UPDATE':
        return 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20';
      case 'DELETE':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      case 'LOCK':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      default:
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
    }
  };

  return (
    <aside 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`hidden md:flex bg-[#090d16] border-l border-slate-800 flex-col overflow-hidden transition-all duration-300 ease-in-out z-50
        lg:sticky lg:top-0 lg:h-screen lg:w-80 lg:shadow-none lg:translate-x-0
        md:fixed md:right-0 md:top-0 md:h-screen
        ${isHovered ? 'md:w-80 md:shadow-2xl md:shadow-black/60' : 'lg:w-80 md:w-16'}
      `}
    >
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#0b101c] flex-shrink-0 min-h-[61px]">
        <div className="flex items-center space-x-2">
          <History className="h-4.5 w-4.5 text-indigo-400 flex-shrink-0" />
          <h2 className={`text-sm font-bold tracking-wider text-slate-200 uppercase transition-all duration-205 whitespace-nowrap lg:opacity-100 lg:w-auto lg:overflow-visible ${
            isHovered ? 'opacity-100' : 'md:opacity-0 md:w-0 md:overflow-hidden'
          }`}>
            Database Mutations
          </h2>
        </div>
        {logs.length > 0 && (
          <button
            onClick={onClearLogs}
            className={`p-1.5 text-slate-400 hover:text-rose-400 transition-all duration-200 rounded-lg hover:bg-slate-800/50 lg:opacity-100 lg:w-auto lg:overflow-visible ${
              isHovered ? 'opacity-100' : 'md:opacity-0 md:w-0 md:overflow-hidden'
            }`}
            title="Clear Audit Logs"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Logs Container */}
      <div className="flex-1 overflow-y-auto p-4 md:p-3 space-y-3.5 scrollbar-thin">
        {logs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <History className="h-8 w-8 text-slate-600 mb-2 stroke-[1.5] flex-shrink-0" />
            <div className={`transition-all duration-250 lg:opacity-100 lg:h-auto lg:overflow-visible ${isHovered ? 'opacity-100' : 'md:opacity-0 md:h-0 md:overflow-hidden'}`}>
              <p className="text-xs font-semibold">No transactions logged</p>
              <p className="text-[10px] text-slate-600 mt-1 max-w-[200px]">
                Mutations like updating hours or creating records will appear here in real-time.
              </p>
            </div>
          </div>
        ) : (
          logs.map((log) => (
            <div 
              key={log.id} 
              className={`p-3 rounded-2xl bg-[#0c1220]/60 border border-slate-800/80 transition-all duration-200 hover:bg-[#0c1220] flex flex-col space-y-2 relative overflow-hidden animate-slide-in ${
                log.action === 'ERROR' ? 'border-rose-500/20 bg-rose-950/5' : ''
              } lg:items-start lg:justify-start lg:p-3 ${isHovered ? '' : 'md:items-center md:justify-center md:p-2'}`}
            >
              {/* Type Badge & Time */}
              <div className="flex items-center justify-between w-full">
                <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg text-[9px] font-bold tracking-wider uppercase flex-shrink-0 ${getActionBadgeClass(log.action)} lg:px-2 lg:py-0.5 ${
                  isHovered ? '' : 'md:px-1.5 md:py-1'
                }`}>
                  {getActionIcon(log.action)}
                  <span className={`lg:inline ${isHovered ? 'inline' : 'md:hidden'}`}>{log.action}</span>
                </span>
                
                <span className={`text-[10px] text-slate-500 font-mono font-medium transition-all duration-200 whitespace-nowrap lg:opacity-100 lg:w-auto lg:overflow-visible ${
                  isHovered ? 'opacity-100' : 'md:opacity-0 md:w-0 md:overflow-hidden'
                }`}>
                  {log.timestamp}
                </span>
              </div>

              {/* Entity Context */}
              {log.entity && (
                <div className={`text-[10px] text-slate-400 font-bold uppercase tracking-wider transition-all duration-200 lg:opacity-100 lg:h-auto lg:overflow-visible ${
                  isHovered ? 'opacity-100' : 'md:opacity-0 md:h-0 md:overflow-hidden'
                }`}>
                  Entity: <span className="text-indigo-400 font-semibold">{log.entity}</span>
                </div>
              )}

              {/* Message Details */}
              <p className={`text-xs text-slate-300 font-medium leading-relaxed break-words transition-all duration-200 lg:opacity-100 lg:h-auto lg:overflow-visible ${
                isHovered ? 'opacity-100' : 'md:opacity-0 md:h-0 md:overflow-hidden'
              }`}>
                {log.message}
              </p>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
