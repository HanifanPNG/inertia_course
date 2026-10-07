import { Link } from '@inertiajs/react';
import type { CSSProperties } from 'react';
import { formatAmount } from '@/lib/format';

export type RevenuePoint = {
    key: string;
    label: string;
    value: number;
    is_current: boolean;
};

export type RevenueSeries = {
    period: 'daily' | 'weekly' | 'monthly';
    window: string;
    points: RevenuePoint[];
};

const WIDTH = 720;
const HEIGHT = 200;
const PADDING = { top: 14, right: 4, bottom: 26, left: 8 };

export function RevenueChart({
    series,
    periods,
    currentPeriod,
    hrefFor,
}: {
    series: RevenueSeries;
    periods: Array<{ value: RevenueSeries['period']; label: string }>;
    currentPeriod: RevenueSeries['period'];
    hrefFor: (period: RevenueSeries['period']) => string;
}) {
    const { points } = series;
    const max = Math.max(...points.map((point) => point.value), 0);
    const plotWidth = WIDTH - PADDING.left - PADDING.right;
    const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;
    const slot = plotWidth / Math.max(points.length, 1);
    const barWidth = Math.max(slot * 0.5, 3);

    return (
        <section aria-labelledby="pendapatan-tren">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
                <div className="flex items-baseline gap-3 border-b border-foreground/25 pb-2">
                    <h2
                        id="pendapatan-tren"
                        className="font-data text-[11px] tracking-[0.24em] uppercase"
                    >
                        Pendapatan {series.window}
                    </h2>
                    <span
                        aria-hidden="true"
                        className="min-w-4 flex-1 translate-y-[-3px] border-b border-dotted border-border"
                    />
                    <span className="font-data text-[11px] text-muted-foreground tabular-nums">
                        Puncak Rp {formatAmount(max)}
                    </span>
                </div>

                <div className="flex overflow-hidden border border-border">
                    {periods.map((period) => (
                        <Link
                            key={period.value}
                            href={hrefFor(period.value)}
                            aria-current={
                                period.value === currentPeriod
                                    ? 'true'
                                    : undefined
                            }
                            className={
                                'px-3 py-1.5 font-data text-[11px] tracking-[0.2em] uppercase transition-colors ' +
                                (period.value === currentPeriod
                                    ? 'bg-foreground text-background'
                                    : 'text-muted-foreground hover:bg-muted')
                            }
                        >
                            {period.label}
                        </Link>
                    ))}
                </div>
            </div>

            {max === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">
                    Belum ada pendapatan pada periode ini.
                </p>
            ) : (
                <figure className="mt-3">
                    <svg
                        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                        role="img"
                        aria-label={`Pendapatan ${series.window}: ${seriesCaption(series)}`}
                        className="h-auto w-full"
                    >
                        <line
                            x1={PADDING.left}
                            y1={PADDING.top + plotHeight}
                            x2={WIDTH - PADDING.right}
                            y2={PADDING.top + plotHeight}
                            stroke="var(--border)"
                            strokeWidth="1"
                        />

                        {points.map((point, index) => {
                            const height =
                                point.value === 0
                                    ? 1
                                    : (point.value / max) * plotHeight;
                            const x =
                                PADDING.left +
                                index * slot +
                                (slot - barWidth) / 2;
                            const y = PADDING.top + plotHeight - height;

                            return (
                                <g key={point.key}>
                                    <rect
                                        x={x}
                                        y={y}
                                        width={barWidth}
                                        height={height}
                                        style={
                                            {
                                                '--bon-bar-index': index,
                                            } as CSSProperties
                                        }
                                        className="bon-bars hover:fill-opacity-100"
                                        fill={
                                            point.is_current
                                                ? 'var(--primary)'
                                                : 'var(--foreground)'
                                        }
                                        fillOpacity={
                                            point.is_current ? 1 : 0.72
                                        }
                                    >
                                        <title>{tooltip(point)}</title>
                                    </rect>

                                    {shouldLabel(index, points.length) && (
                                        <text
                                            x={x + barWidth / 2}
                                            y={HEIGHT - 8}
                                            textAnchor="middle"
                                            className="fill-muted-foreground font-data text-[10px]"
                                        >
                                            {point.label}
                                        </text>
                                    )}
                                </g>
                            );
                        })}
                    </svg>

                    <figcaption className="sr-only">
                        {points
                            .map(
                                (point) =>
                                    `${point.label}: Rp ${formatAmount(point.value)}`,
                            )
                            .join(', ')}
                    </figcaption>
                </figure>
            )}
        </section>
    );
}

function shouldLabel(index: number, total: number): boolean {
    const every = total > 10 ? Math.ceil(total / 7) : 1;

    return index === total - 1 || index % every === 0;
}

function tooltip(point: RevenuePoint): string {
    return `${point.label} · Rp ${formatAmount(point.value)}`;
}

function seriesCaption(series: RevenueSeries): string {
    const { points } = series;

    if (points.length === 0) {
        return 'tidak ada data';
    }

    const first = points[0];
    const last = points[points.length - 1];
    const total = points.reduce((sum, point) => sum + point.value, 0);

    return `${first.label} sampai ${last.label}, total Rp ${formatAmount(total)}`;
}
