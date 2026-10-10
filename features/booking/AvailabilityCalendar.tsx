'use client';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { type KeyboardEvent, useEffect, useRef, useState } from 'react';
import { type BookedSet, type SelectionContext } from '@/domain/availability';
import {
  addDays,
  addMonths,
  firstDayOfMonth,
  lastDayOfMonth,
  monthKeyOf,
  nightsBetween,
  weekdayMondayFirst,
} from '@/domain/dates';
import { type DateSelection, isDateSelectable } from '@/domain/selection';
import type { ISODate, MonthKey } from '@/domain/types';
import { formatDate, formatDateLong, formatMonthTitle, pluralize } from '@/lib/format';
import type { MonthStatus } from './use-availability';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface AvailabilityCalendarProps {
  months: MonthKey[];
  today: ISODate;
  windowEnd: ISODate;
  booked: BookedSet;
  status: Record<MonthKey, MonthStatus>;
  selection: DateSelection;
  onSelect: (date: ISODate) => void;
  onRetry: () => void;
}

function buildWeeks(month: MonthKey): (ISODate | null)[][] {
  const first = firstDayOfMonth(month);
  const last = lastDayOfMonth(month);
  const cells: (ISODate | null)[] = Array(weekdayMondayFirst(first)).fill(null);
  for (let d = first; d <= last; d = addDays(d, 1)) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (ISODate | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

function shiftMonth(date: ISODate, delta: number): ISODate {
  const target = addMonths(monthKeyOf(date), delta);
  const day = Math.min(Number(date.slice(8)), Number(lastDayOfMonth(target).slice(8)));
  return `${target}-${String(day).padStart(2, '0')}`;
}

export function AvailabilityCalendar({
  months,
  today,
  windowEnd,
  booked,
  status,
  selection,
  onSelect,
  onRetry,
}: AvailabilityCalendarProps) {
  const ctx: SelectionContext = { today, windowEnd, booked };
  // A range may span months, so nothing is selectable until *every* month's bookings are known.
  const allLoaded = months.every((month) => status[month] === 'success');
  const rangeStart = months[0] ? firstDayOfMonth(months[0]) : today;
  const rangeEnd = months.length ? lastDayOfMonth(months[months.length - 1] as MonthKey) : today;

  // Roving tabindex: the calendar is a single tab stop; arrows move within it.
  const [focusDate, setFocusDate] = useState<ISODate>(selection.checkIn || today);
  const gridRef = useRef<HTMLDivElement>(null);
  const shouldMoveFocus = useRef(false);

  useEffect(() => {
    if (!shouldMoveFocus.current) return;
    shouldMoveFocus.current = false;
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-date="${focusDate}"]`)?.focus();
  }, [focusDate]);

  const tabbable = focusDate >= rangeStart && focusDate <= rangeEnd ? focusDate : rangeStart;

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const current = (event.target as HTMLElement).closest<HTMLElement>('[data-date]')?.dataset.date;
    if (!current) return;
    const weekday = weekdayMondayFirst(current);
    const moves: Record<string, ISODate> = {
      ArrowLeft: addDays(current, -1),
      ArrowRight: addDays(current, 1),
      ArrowUp: addDays(current, -7),
      ArrowDown: addDays(current, 7),
      Home: addDays(current, -weekday),
      End: addDays(current, 6 - weekday),
      PageUp: shiftMonth(current, -1),
      PageDown: shiftMonth(current, 1),
    };
    const next = moves[event.key];
    if (!next) return;
    event.preventDefault();
    if (next < rangeStart || next > rangeEnd) return;
    shouldMoveFocus.current = true;
    setFocusDate(next);
  };

  const { checkIn, checkOut } = selection;
  const summary =
    checkIn && checkOut
      ? `${formatDate(checkIn)} → ${formatDate(checkOut)} · ${pluralize(nightsBetween(checkIn, checkOut), 'night')}`
      : checkIn
        ? `Check-in ${formatDate(checkIn)}. Now choose your check-out date.`
        : 'Choose your check-in date.';

  return (
    <Box ref={gridRef} onKeyDown={onKeyDown}>
      <Typography
        role="status"
        sx={{ mb: 2, fontWeight: 600, minHeight: 28 }}
        data-testid="selection-summary"
      >
        {summary}
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(auto-fit, minmax(270px, 1fr))' },
        }}
      >
        {months.map((month) => {
          const monthStatus = status[month] ?? 'pending';
          const headingId = `cal-${month}`;
          return (
            <Box
              key={month}
              component="section"
              aria-labelledby={headingId}
              aria-busy={monthStatus === 'pending'}
            >
              <Typography id={headingId} component="h3" variant="h6" sx={{ mb: 1 }}>
                {formatMonthTitle(month)}
              </Typography>
              {monthStatus === 'error' ? (
                <Alert
                  severity="error"
                  action={
                    <Button color="inherit" size="small" onClick={onRetry}>
                      Retry
                    </Button>
                  }
                  sx={{ mb: 1 }}
                >
                  Couldn’t load availability for {formatMonthTitle(month)}.
                </Alert>
              ) : null}
              {monthStatus === 'pending' ? (
                <Typography role="status" variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Loading availability…
                </Typography>
              ) : null}
              <Box
                component="table"
                role="grid"
                aria-labelledby={headingId}
                sx={{
                  width: '100%',
                  borderCollapse: 'separate',
                  borderSpacing: '0 2px',
                  tableLayout: 'fixed',
                  opacity: monthStatus === 'success' ? 1 : 0.55,
                }}
              >
                <thead>
                  <tr>
                    {WEEKDAYS.map((name) => (
                      <Box
                        component="th"
                        scope="col"
                        key={name}
                        sx={{ fontWeight: 600, fontSize: 12, color: 'text.secondary', pb: 0.5 }}
                      >
                        <abbr title={name} style={{ textDecoration: 'none' }}>
                          {name.slice(0, 2)}
                        </abbr>
                      </Box>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {buildWeeks(month).map((week, weekIndex) => (
                    <tr key={weekIndex}>
                      {week.map((date, dayIndex) =>
                        date ? (
                          <DayCell
                            key={date}
                            date={date}
                            ctx={ctx}
                            selection={selection}
                            loaded={allLoaded}
                            tabbable={date === tabbable}
                            onPick={() => {
                              setFocusDate(date);
                              onSelect(date);
                            }}
                          />
                        ) : (
                          <td key={`blank-${dayIndex}`} />
                        ),
                      )}
                    </tr>
                  ))}
                </tbody>
              </Box>
            </Box>
          );
        })}
      </Box>
      <Legend />
    </Box>
  );
}

interface DayCellProps {
  date: ISODate;
  ctx: SelectionContext;
  selection: DateSelection;
  loaded: boolean;
  tabbable: boolean;
  onPick: () => void;
}

function describe(date: ISODate, parts: string[]): string {
  return [formatDateLong(date), ...parts].join(', ');
}

function DayCell({ date, ctx, selection, loaded, tabbable, onPick }: DayCellProps) {
  const { checkIn, checkOut } = selection;
  const isBooked = ctx.booked.has(date);
  const isPast = date < ctx.today;
  const selectable = loaded && isDateSelectable(selection, date, ctx);
  const isStart = date === checkIn;
  const isEnd = date === checkOut;
  const inRange = Boolean(checkIn && checkOut && date > checkIn && date < checkOut);
  const checkOutOnly = selectable && isBooked;

  const parts: string[] = [];
  if (isStart) parts.push('check-in');
  if (isEnd) parts.push('check-out');
  if (inRange) parts.push('in your stay');
  if (!selectable && !isStart && !isEnd) {
    parts.push(
      !loaded
        ? 'availability loading'
        : isPast
          ? 'unavailable, in the past'
          : isBooked
            ? 'unavailable, booked'
            : 'unavailable for this stay',
    );
  }
  if (checkOutOnly) parts.push('available as check-out only');
  if (selectable && !isStart && !isEnd && !checkOutOnly) parts.push('available');

  const filled = isStart || isEnd;
  return (
    <Box
      component="td"
      role="gridcell"
      aria-selected={filled || inRange}
      sx={{ p: 0, textAlign: 'center', bgcolor: inRange ? 'rgba(31,77,69,.12)' : 'transparent' }}
    >
      <Box
        component="button"
        type="button"
        data-date={date}
        aria-label={describe(date, parts)}
        aria-disabled={!selectable}
        tabIndex={tabbable ? 0 : -1}
        onClick={() => {
          if (selectable) onPick();
        }}
        sx={{
          width: '100%',
          aspectRatio: '1 / 1',
          minHeight: 40,
          border: 0,
          borderRadius: filled ? 999 : 2,
          font: 'inherit',
          fontWeight: filled ? 700 : 500,
          cursor: selectable ? 'pointer' : 'not-allowed',
          bgcolor: filled ? 'primary.main' : 'transparent',
          color: filled ? '#fff' : selectable ? 'text.primary' : 'text.disabled',
          // Booked nights read as struck-through; past days are simply dimmed.
          textDecoration: !selectable && isBooked && !isPast ? 'line-through' : 'none',
          borderBottom: checkOutOnly ? '2px dotted' : 'none',
          '&:hover': selectable && !filled ? { bgcolor: 'rgba(31,77,69,.16)' } : undefined,
        }}
      >
        <span aria-hidden>{Number(date.slice(8))}</span>
      </Box>
    </Box>
  );
}

function Legend() {
  const swatch = (sx: object) => (
    <Box
      aria-hidden
      component="span"
      sx={{ width: 16, height: 16, borderRadius: 1, display: 'inline-block', ...sx }}
    />
  );
  return (
    <Box
      component="ul"
      aria-label="Calendar legend"
      sx={{
        listStyle: 'none',
        m: 0,
        mt: 2.5,
        p: 0,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 2.5,
        fontSize: 13,
        color: 'text.secondary',
      }}
    >
      <li>{swatch({ bgcolor: 'primary.main' })} Selected</li>
      <li>{swatch({ border: '1px solid', borderColor: 'divider', bgcolor: '#fff' })} Available</li>
      <li>
        <Box component="span" sx={{ textDecoration: 'line-through', mr: 0.5 }}>
          12
        </Box>
        Booked
      </li>
      <li>
        <Box component="span" sx={{ borderBottom: '2px dotted', mr: 0.5 }}>
          12
        </Box>
        Check-out only
      </li>
    </Box>
  );
}
