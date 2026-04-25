import { useState, useMemo } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays 
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, MapPin, ExternalLink } from 'lucide-react';
import { useCaseStore } from '../store/useCaseStore';
import type { Case } from '../types';
import clsx from 'clsx';
import { todayISO } from '../utils/dateFormat';

export function SmartCalendar() {
  const { cases } = useCaseStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const today = new Date(todayISO());

  const casesForSelectedDay = useMemo(() => {
    return cases.filter(c => {
      // Assuming c.nextHearingDate is YYYY-MM-DD
      const caseDate = new Date(c.nextHearingDate);
      return isSameDay(caseDate, selectedDate);
    });
  }, [cases, selectedDate]);

  const generateGCalLink = (c: Case) => {
    const base = "https://calendar.google.com/calendar/render?action=TEMPLATE";
    const title = encodeURIComponent(`Hearing: ${c.title} (${c.caseNumber})`);
    
    const d = new Date(c.nextHearingDate || todayISO());
    // Format YYYYMMDD for an all day event
    const nextDay = new Date(d);
    nextDay.setDate(nextDay.getDate() + 1); // Google Calendar all day events require end date to be day+1
    
    const startStr = d.toISOString().split('T')[0].replace(/-/g, '');
    const endStr = nextDay.toISOString().split('T')[0].replace(/-/g, '');
    
    const dates = `${startStr}/${endStr}`;
    const details = encodeURIComponent(`VakilDesk Automated Sync\nStatus: ${c.status}\nCourt: ${c.court}\nDue Fees: ${c.totalFees - c.feesPaid}`);
    const location = encodeURIComponent(c.court || '');
    
    return `${base}&text=${title}&dates=${dates}&details=${details}&location=${location}`;
  };

  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-400">
            Legal Calendar
          </h2>
          <p className="text-slate-400 mt-2">Track hearings and sync to Google Calendar instantly.</p>
        </div>
        <div className="flex items-center space-x-4">
          <button onClick={() => setCurrentDate(today)} className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors cursor-pointer">
            Today
          </button>
          <div className="flex items-center bg-slate-800 border border-slate-700/50 rounded-lg p-1">
            <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2 text-slate-400 hover:text-slate-100 rounded-md hover:bg-slate-700 transition-colors cursor-pointer">
              <ChevronLeft size={20} />
            </button>
            <span className="w-40 text-center font-bold text-slate-200">
              {format(currentDate, 'MMMM yyyy')}
            </span>
            <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2 text-slate-400 hover:text-slate-100 rounded-md hover:bg-slate-700 transition-colors cursor-pointer">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday start
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = '';

    // Weekdays Header
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const daysHeader = (
      <div className="grid grid-cols-7 mb-2" key="header">
        {weekdays.map(wd => (
          <div key={wd} className="text-center font-semibold text-sm text-slate-400 py-2">
            {wd}
          </div>
        ))}
      </div>
    );

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, 'd');
        const cloneDay = day;

        const dayHearings = cases.filter(c => isSameDay(new Date(c.nextHearingDate), cloneDay));
        const hasHearings = dayHearings.length > 0;
        const isSelected = isSameDay(cloneDay, selectedDate);
        const isCurrentMonth = isSameMonth(cloneDay, monthStart);
        const isTodayDay = isSameDay(cloneDay, today);

        days.push(
          <div
            key={day.toString()}
            onClick={() => setSelectedDate(cloneDay)}
            className={clsx(
              'min-h-24 p-2 border border-slate-800/50 transition-all cursor-pointer relative group flex flex-col',
              !isCurrentMonth ? 'bg-slate-800/10 text-slate-600' : 'bg-slate-800/30 text-slate-300 hover:bg-slate-700/40',
              isSelected && isCurrentMonth ? 'ring-2 ring-blue-500 bg-blue-500/10 z-10' : '',
              isTodayDay && !isSelected ? 'font-bold bg-slate-700/50' : ''
            )}
          >
            <div className="flex justify-between items-start">
              <span className={clsx(
                "h-7 w-7 flex items-center justify-center rounded-full text-sm",
                isTodayDay && !isSelected ? 'bg-blue-500 text-white' : '',
                isSelected && !isTodayDay ? 'text-blue-400 font-bold' : ''
              )}>
                {formattedDate}
              </span>
              {hasHearings && (
                <div className="flex space-x-1 mt-1">
                  {dayHearings.slice(0, 3).map((_, i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_5px_rgba(251,191,36,0.5)]"></div>
                  ))}
                  {dayHearings.length > 3 && <span className="text-[10px] text-amber-500 font-bold leading-none">+</span>}
                </div>
              )}
            </div>
            
            <div className="mt-auto pt-2 space-y-1 overflow-hidden">
              {dayHearings.slice(0, 2).map((c, i) => (
                <div key={i} className="text-xs truncate text-slate-400 bg-slate-800/80 px-1.5 py-1 rounded border border-slate-700/50">
                  {c.title}
                </div>
              ))}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }

    return (
      <div className="glass-panel overflow-hidden w-full h-full flex flex-col p-1">
        {daysHeader}
        <div className="flex-1 overflow-y-auto">
          {rows}
        </div>
      </div>
    );
  };

  const renderSidePanel = () => {
    return (
      <div className="w-96 shrink-0 glass-panel border-l border-slate-700/50 flex flex-col">
        <div className="p-6 border-b border-slate-700/50 bg-slate-800/30">
          <h3 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
            <CalendarIcon className="text-blue-400" size={24} />
            <span>{format(selectedDate, 'MMMM d, yyyy')}</span>
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            {isSameDay(selectedDate, today) ? 'Today' : format(selectedDate, 'EEEE')}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {casesForSelectedDay.length === 0 ? (
            <div className="text-center py-10">
              <CalendarIcon size={40} className="mx-auto text-slate-600 mb-3" />
              <p className="text-slate-400 font-medium">No hearings scheduled</p>
              <p className="text-slate-500 text-sm mt-1">Enjoy a free day.</p>
            </div>
          ) : (
            casesForSelectedDay.map(c => (
              <div key={c.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 hover:border-slate-600 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-slate-200 line-clamp-2 pr-2">{c.title}</h4>
                  <span className={clsx(
                    'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 mt-0.5',
                    c.status === 'active' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-500'
                  )}>
                    {c.status}
                  </span>
                </div>
                <p className="text-xs font-mono text-slate-400 mb-3">{c.caseNumber}</p>
                
                <div className="flex items-center space-x-2 text-sm text-slate-300 mb-4">
                  <MapPin size={14} className="text-blue-400 shrink-0" />
                  <span className="truncate">{c.court}</span>
                </div>

                <button
                  onClick={() => window.open(generateGCalLink(c), '_blank', 'noopener,noreferrer')}
                  className="w-full flex items-center justify-center space-x-2 bg-[#4285F4]/10 hover:bg-[#4285F4]/20 border border-[#4285F4]/30 text-blue-400 py-2 rounded-lg transition-colors cursor-pointer text-sm font-medium"
                >
                  <CalendarIcon size={14} />
                  <span>Sync to gCal</span>
                  <ExternalLink size={12} className="opacity-50" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col p-8 overflow-hidden h-full">
      {renderHeader()}
      <div className="flex-1 flex space-x-6 min-h-0">
        <div className="flex-1 min-w-0">
           {renderCells()}
        </div>
        {renderSidePanel()}
      </div>
    </div>
  );
}
