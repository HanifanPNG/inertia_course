import { useEffect, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const WEEKDAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
const MONTHS = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
];

const pad = (value: number) => String(value).padStart(2, '0');

/**
 * A date field that opens a calendar instead of being typed into.
 *
 * Cashiers and owners filter by whole days and months, never by typing a
 * partial date, so the picker only ever commits a complete `Y-m-d` or `Y-m`.
 */
export function DatePicker({
    name,
    value,
    onChange,
    mode = 'day',
    id,
    className,
    ariaLabel,
}: {
    name: string;
    value: string | null;
    onChange: (value: string) => void;
    mode?: 'day' | 'month';
    id?: string;
    className?: string;
    ariaLabel?: string;
}) {
    const [open, setOpen] = useState(false);
    const [cursor, setCursor] = useState(() => parseValue(value, new Date()));

    const wrapper = useRef<HTMLDivElement>(null);

    /*
     * The cursor is recomputed when the popover opens instead of inside an
     * effect: a `new Date()` in an effect dependency list is a new value on
     * every render, which loops the effect until React gives up.
     */
    const toggle = () => {
        if (!open) {
            setCursor(parseValue(value, new Date()));
        }

        setOpen(!open);
    };

    useEffect(() => {
        if (!open) {
            return;
        }

        const onPointerDown = (event: MouseEvent) => {
            if (!wrapper.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);

        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [open]);

    const commit = (next: string) => {
        onChange(next);
        setOpen(false);
    };

    return (
        <div ref={wrapper} className={cn('relative', className)}>
            {value && <input type="hidden" name={name} value={value} />}

            <button
                id={id}
                type="button"
                onClick={toggle}
                aria-expanded={open}
                aria-haspopup="dialog"
                aria-label={ariaLabel}
                className="flex h-9 w-full items-center justify-between gap-2 rounded-none border border-input bg-card px-3 font-data text-[13px] transition-colors hover:border-foreground/40 focus-visible:border-primary focus-visible:outline-none"
            >
                <span className={value ? '' : 'text-muted-foreground'}>
                    {value ? formatValue(value, mode) : 'Pilih tanggal'}
                </span>
                <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
            </button>

            {open && (
                <div
                    role="dialog"
                    aria-label={ariaLabel ?? 'Pilih tanggal'}
                    className="absolute top-full left-0 z-50 mt-1 w-64 border border-border bg-card p-3 shadow-md"
                >
                    {mode === 'day' ? (
                        <DayCalendar
                            cursor={cursor}
                            value={value}
                            onCursorChange={setCursor}
                            onSelect={commit}
                        />
                    ) : (
                        <MonthCalendar
                            cursor={cursor}
                            value={value}
                            onCursorChange={setCursor}
                            onSelect={commit}
                        />
                    )}
                </div>
            )}
        </div>
    );
}

function DayCalendar({
    cursor,
    value,
    onCursorChange,
    onSelect,
}: {
    cursor: Date;
    value: string | null;
    onCursorChange: (date: Date) => void;
    onSelect: (value: string) => void;
}) {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayIso = toIso(new Date());

    const cells: Array<number | null> = [
        ...Array.from({ length: firstWeekday }, () => null),
        ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
    ];

    return (
        <>
            <header className="flex items-center justify-between">
                <StepButton
                    label="Bulan sebelumnya"
                    onClick={() => onCursorChange(new Date(year, month - 1, 1))}
                >
                    <ChevronLeft className="size-4" />
                </StepButton>

                <span className="font-data text-[12px] tracking-[0.12em] uppercase">
                    {MONTHS[month]} {year}
                </span>

                <StepButton
                    label="Bulan berikutnya"
                    onClick={() => onCursorChange(new Date(year, month + 1, 1))}
                >
                    <ChevronRight className="size-4" />
                </StepButton>
            </header>

            <div className="mt-2 grid grid-cols-7 gap-1 font-data text-[10px] tracking-[0.1em] text-muted-foreground uppercase">
                {WEEKDAYS.map((day) => (
                    <span key={day} className="text-center">
                        {day}
                    </span>
                ))}
            </div>

            <div className="mt-1 grid grid-cols-7 gap-1">
                {cells.map((day, index) =>
                    day === null ? (
                        <span key={`blank-${index}`} />
                    ) : (
                        <button
                            key={day}
                            type="button"
                            onClick={() =>
                                onSelect(
                                    `${year}-${pad(month + 1)}-${pad(day)}`,
                                )
                            }
                            aria-current={
                                value ===
                                `${year}-${pad(month + 1)}-${pad(day)}`
                                    ? 'date'
                                    : undefined
                            }
                            className={cn(
                                'h-8 font-data text-[13px] tabular-nums transition-colors',
                                value ===
                                    `${year}-${pad(month + 1)}-${pad(day)}`
                                    ? 'bg-primary text-primary-foreground'
                                    : 'hover:bg-muted',
                                todayIso ===
                                    `${year}-${pad(month + 1)}-${pad(day)}`
                                    ? 'underline underline-offset-2'
                                    : '',
                            )}
                        >
                            {day}
                        </button>
                    ),
                )}
            </div>

            <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
                <button
                    type="button"
                    onClick={() => onSelect(todayIso)}
                    className="font-data text-[11px] tracking-[0.16em] uppercase hover:underline"
                >
                    Hari ini
                </button>
                <button
                    type="button"
                    onClick={() => onSelect('')}
                    className="font-data text-[11px] tracking-[0.16em] text-muted-foreground uppercase hover:underline"
                >
                    Semua
                </button>
            </div>
        </>
    );
}

function MonthCalendar({
    cursor,
    value,
    onCursorChange,
    onSelect,
}: {
    cursor: Date;
    value: string | null;
    onCursorChange: (date: Date) => void;
    onSelect: (value: string) => void;
}) {
    const year = cursor.getFullYear();
    const selectedMonth = value ? Number(value.split('-')[1]) : null;

    return (
        <>
            <header className="flex items-center justify-between">
                <StepButton
                    label="Tahun sebelumnya"
                    onClick={() => onCursorChange(new Date(year - 1, 0, 1))}
                >
                    <ChevronLeft className="size-4" />
                </StepButton>

                <span className="font-data text-[12px] tracking-[0.12em] uppercase">
                    {year}
                </span>

                <StepButton
                    label="Tahun berikutnya"
                    onClick={() => onCursorChange(new Date(year + 1, 0, 1))}
                >
                    <ChevronRight className="size-4" />
                </StepButton>
            </header>

            <div className="mt-2 grid grid-cols-3 gap-1">
                {MONTHS.map((month, index) => (
                    <button
                        key={month}
                        type="button"
                        onClick={() => onSelect(`${year}-${pad(index + 1)}`)}
                        aria-current={
                            selectedMonth === index + 1 ? 'date' : undefined
                        }
                        className={cn(
                            'h-9 font-data text-[11px] tracking-[0.08em] uppercase transition-colors',
                            selectedMonth === index + 1
                                ? 'bg-primary text-primary-foreground'
                                : 'hover:bg-muted',
                        )}
                    >
                        {month.slice(0, 3)}
                    </button>
                ))}
            </div>
        </>
    );
}

function StepButton({
    label,
    onClick,
    children,
}: {
    label: string;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={label}
            className="flex size-7 items-center justify-center border border-border text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
        >
            {children}
        </button>
    );
}

function toIso(date: Date): string {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseValue(value: string | null, fallback: Date): Date {
    if (!value) {
        return fallback;
    }

    const [year, month, day] = value.split('-').map(Number);
    const parsed = new Date(year, (month ?? 1) - 1, day ?? 1);

    return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

function formatValue(value: string, mode: 'day' | 'month'): string {
    const [year, month, day] = value.split('-').map(Number);

    if (mode === 'month') {
        return `${MONTHS[(month ?? 1) - 1]} ${year}`;
    }

    return `${pad(day ?? 1)}/${pad(month ?? 1)}/${year}`;
}
