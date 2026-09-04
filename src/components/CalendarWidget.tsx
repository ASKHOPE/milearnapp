import React, { useState } from 'react';
import type { Note } from '../types';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

interface CalendarWidgetProps {
  notes: Note[];
  onSelectDate: (dateStr: string) => void;
  onOpenTodayNote: () => void;
}

export const CalendarWidget: React.FC<CalendarWidgetProps> = ({
  notes,
  onSelectDate,
  onOpenTodayNote
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  // Build mapping of date -> note count
  const notesByDate = new Map<string, number>();
  notes.forEach((n) => {
    try {
      const d = new Date(n.createdAt);
      const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
      notesByDate.set(key, (notesByDate.get(key) || 0) + 1);
    } catch {}
  });

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const daysCells = [];
  // Empty padding cells before 1st of month
  for (let i = 0; i < firstDayIndex; i++) {
    daysCells.push(<div key={`pad-${i}`} className="calendar-day empty" />);
  }

  // Days of current month
  for (let day = 1; day <= totalDaysInMonth; day++) {
    const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    const noteCount = notesByDate.get(dateStr) || 0;
    const isToday = isCurrentMonth && today.getDate() === day;

    daysCells.push(
      <button
        key={`day-${day}`}
        className={`calendar-day ${isToday ? 'today' : ''} ${noteCount > 0 ? 'has-notes' : ''}`}
        onClick={() => onSelectDate(dateStr)}
        title={`${dateStr} (${noteCount} note${noteCount !== 1 ? 's' : ''})`}
      >
        <span>{day}</span>
        {noteCount > 0 && <span className="calendar-dot" />}
      </button>
    );
  }

  return (
    <div className="calendar-widget">
      {/* Today's Daily Note Trigger */}
      <button className="today-note-btn" onClick={onOpenTodayNote} title="Open or create today's daily log">
        <Sparkles size={13} color="var(--accent-primary)" />
        <span>Today's Daily Note</span>
      </button>

      {/* Month & Year Navigation Row */}
      <div className="calendar-nav-row">
        <div className="calendar-month-year-group">
          <span className="calendar-month-label">{monthNames[month]}</span>
          <span className="calendar-year-badge">{year}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          <button className="cal-nav-btn" onClick={handlePrevMonth} title="Previous Month">
            <ChevronLeft size={14} />
          </button>
          <button className="cal-nav-btn" onClick={handleNextMonth} title="Next Month">
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Timezone & Local Clock Status Chip */}
      <div className="calendar-timezone-bar">
        <div className="cal-timezone-left">
          <span className="cal-tz-dot" />
          <span className="cal-tz-name" title={Intl.DateTimeFormat().resolvedOptions().timeZone}>
            {(() => {
              try {
                const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local';
                // Shorten e.g. "Asia/Kolkata" -> "Asia/Kolkata" or "IST"
                return tz;
              } catch {
                return 'Local Time';
              }
            })()}
          </span>
        </div>
        <span className="cal-tz-offset">
          {(() => {
            const offsetMinutes = -new Date().getTimezoneOffset();
            const sign = offsetMinutes >= 0 ? '+' : '-';
            const hours = Math.floor(Math.abs(offsetMinutes) / 60).toString().padStart(2, '0');
            const mins = (Math.abs(offsetMinutes) % 60).toString().padStart(2, '0');
            return `UTC${sign}${hours}:${mins}`;
          })()}
        </span>
      </div>

      {/* Weekday Names */}
      <div className="calendar-weekdays">
        <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
      </div>

      {/* Grid of Days */}
      <div className="calendar-grid">
        {daysCells}
      </div>
    </div>
  );
};
