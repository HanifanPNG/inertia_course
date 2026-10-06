import { Head, router } from '@inertiajs/react';
import { Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import Heading from '@/components/heading';
import { LedgerStats } from '@/components/ledger-stats';
import type { LedgerStat } from '@/components/ledger-stats';
import { Button } from '@/components/ui/button';
import { formatAmount, formatCurrency } from '@/lib/format';
import { dashboard } from '@/routes/admin';
import { exportMethod, index as reports } from '@/routes/admin/reports';
import { cn } from '@/lib/utils';

export type ReportFilters = {
    period: 'daily' | 'monthly';
    date: string;
    month: string;
};

export type ReportRow = {
    date: string;
    transactions: number;
    paid_orders: number;
    revenue: string;
    items: number;
    best_seller: string;
};

export type ReportSummary = {
    transactions: number;
    paid_orders: number;
    revenue: string;
    items_sold: number;
    best_seller: { name: string; quantity: number } | null;
    payments: Array<{ method: string; label: string; amount: string }>;
};

const stats = (summary: ReportSummary): LedgerStat[] => [
    { label: 'Pendapatan', value: formatCurrency(summary.revenue) },
    { label: 'Transaksi', value: String(summary.transactions) },
    { label: 'Item Terjual', value: String(summary.items_sold) },
    { label: 'Pesanan Dibayar', value: String(summary.paid_orders) },
];

export default function ReportIndex({
    filters,
    report,
}: {
    filters: ReportFilters;
    report: { rows: ReportRow[]; summary: ReportSummary };
}) {
    const [date, setDate] = useState(filters.date);
    const [month, setMonth] = useState(filters.month);

    useEffect(() => {
        setDate(filters.date);
        setMonth(filters.month);
    }, [filters.date, filters.month]);

    const filterQuery = {
        period: filters.period,
        ...(filters.period === 'daily'
            ? { date: filters.date }
            : { month: filters.month }),
    };

    const goto = (params: Record<string, string>) =>
        router.get(
            reports.url({ query: params }),
            {},
            { preserveState: true, preserveScroll: true },
        );

    const exportHref = exportMethod.url({ query: filterQuery });

    return (
        <>
            <Head title="Laporan Penjualan" />

            <h1 className="sr-only">Laporan Penjualan</h1>

            <div>
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <Heading
                        title="Laporan Penjualan"
                        description="Ringkasan transaksi berdasarkan periode"
                    />

                    <Button asChild variant="outline">
                        <a href={exportHref} download>
                            <Download className="mr-2 h-4 w-4" />
                            Export CSV
                        </a>
                    </Button>
                </div>

                <div aria-hidden="true" className="bon-rule mt-4 sm:mt-1" />

                <div className="mt-6 flex flex-wrap items-center gap-3">
                    <div className="flex overflow-hidden border border-border">
                        {(['daily', 'monthly'] as const).map((period) => (
                            <button
                                key={period}
                                type="button"
                                onClick={() =>
                                    goto({
                                        period,
                                        ...(filters.period === 'daily'
                                            ? { date: filters.date }
                                            : { month: filters.month }),
                                    })
                                }
                                aria-pressed={filters.period === period}
                                className={cn(
                                    'px-4 py-2 font-data text-[11px] tracking-[0.2em] uppercase transition-colors',
                                    filters.period === period
                                        ? 'bg-foreground text-background'
                                        : 'text-muted-foreground hover:bg-muted',
                                )}
                            >
                                {period === 'daily' ? 'Harian' : 'Bulanan'}
                            </button>
                        ))}
                    </div>

                    <label className="flex items-center gap-2 text-sm">
                        <span className="font-data text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
                            {filters.period === 'daily' ? 'Tanggal' : 'Bulan'}
                        </span>
                        <input
                            type={filters.period === 'daily' ? 'date' : 'month'}
                            value={filters.period === 'daily' ? date : month}
                            onChange={(event) =>
                                filters.period === 'daily'
                                    ? setDate(event.target.value)
                                    : setMonth(event.target.value)
                            }
                            onBlur={() =>
                                goto({
                                    period: filters.period,
                                    ...(filters.period === 'daily'
                                        ? { date }
                                        : { month }),
                                })
                            }
                            className="h-9 rounded-none border border-input bg-card px-2 font-data text-[13px]"
                        />
                    </label>
                </div>

                <LedgerStats stats={stats(report.summary)} className="mt-6" />

                <div className="mt-10 grid gap-8 lg:grid-cols-2">
                    <section aria-labelledby="metode-pembayaran">
                        <h2
                            id="metode-pembayaran"
                            className="font-data text-[11px] tracking-[0.24em] uppercase"
                        >
                            Metode Pembayaran
                        </h2>

                        <ul className="mt-3 border-t border-border">
                            {report.summary.payments.map((payment) => (
                                <li
                                    key={payment.method}
                                    className="flex items-baseline gap-3 border-b border-border py-2.5"
                                >
                                    <span className="text-sm">
                                        {payment.label}
                                    </span>
                                    <span
                                        aria-hidden="true"
                                        className="mx-1 min-w-4 flex-1 translate-y-[-3px] border-b border-dotted border-border"
                                    />
                                    <span className="shrink-0 font-data text-sm text-foreground tabular-nums">
                                        {formatCurrency(payment.amount)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </section>

                    <section aria-labelledby="menu-terlaris">
                        <h2
                            id="menu-terlaris"
                            className="font-data text-[11px] tracking-[0.24em] uppercase"
                        >
                            Menu Terlaris
                        </h2>

                        <div className="mt-3 border-y border-border py-2.5">
                            {report.summary.best_seller ? (
                                <div className="flex items-baseline gap-3">
                                    <span className="text-sm font-medium">
                                        {report.summary.best_seller.name}
                                    </span>
                                    <span
                                        aria-hidden="true"
                                        className="mx-1 min-w-4 flex-1 translate-y-[-3px] border-b border-dotted border-border"
                                    />
                                    <span className="shrink-0 font-data text-sm text-foreground tabular-nums">
                                        {report.summary.best_seller.quantity}{' '}
                                        porsi
                                    </span>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    Belum ada penjualan.
                                </p>
                            )}
                        </div>
                    </section>
                </div>

                <section aria-labelledby="rincian-harian" className="mt-10">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                        <h2
                            id="rincian-harian"
                            className="font-data text-[11px] tracking-[0.24em] uppercase"
                        >
                            Rincian Harian
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            {filters.period === 'daily'
                                ? 'Detail transaksi pada tanggal terpilih'
                                : 'Detail transaksi sepanjang bulan terpilih'}
                        </p>
                    </div>

                    {report.rows.length === 0 ? (
                        <p className="mt-4 text-sm text-muted-foreground">
                            Tidak ada transaksi pada periode ini.
                        </p>
                    ) : (
                        <div className="mt-3 overflow-x-auto">
                            <table className="w-full min-w-[40rem] text-sm">
                                <thead>
                                    <tr className="border-y border-border text-left">
                                        <th className="py-2 pr-4 font-data text-[10.5px] font-medium tracking-[0.2em] text-muted-foreground uppercase">
                                            Tanggal
                                        </th>
                                        <th className="py-2 pr-4 text-right font-data text-[10.5px] font-medium tracking-[0.2em] text-muted-foreground uppercase">
                                            Transaksi
                                        </th>
                                        <th className="py-2 pr-4 text-right font-data text-[10.5px] font-medium tracking-[0.2em] text-muted-foreground uppercase">
                                            Dibayar
                                        </th>
                                        <th className="py-2 pr-4 text-right font-data text-[10.5px] font-medium tracking-[0.2em] text-muted-foreground uppercase">
                                            Pendapatan (Rp)
                                        </th>
                                        <th className="py-2 pr-4 text-right font-data text-[10.5px] font-medium tracking-[0.2em] text-muted-foreground uppercase">
                                            Item
                                        </th>
                                        <th className="py-2 font-data text-[10.5px] font-medium tracking-[0.2em] text-muted-foreground uppercase">
                                            Terlaris
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {report.rows.map((row) => (
                                        <tr
                                            key={row.date}
                                            className="border-b border-border last:border-b-0"
                                        >
                                            <td className="py-2 pr-4 font-data text-[13px] tabular-nums">
                                                {row.date}
                                            </td>
                                            <td className="py-2 pr-4 text-right font-data text-[13px] tabular-nums">
                                                {row.transactions}
                                            </td>
                                            <td className="py-2 pr-4 text-right font-data text-[13px] tabular-nums">
                                                {row.paid_orders}
                                            </td>
                                            <td className="py-2 pr-4 text-right font-data text-[13px] tabular-nums">
                                                {formatAmount(row.revenue)}
                                            </td>
                                            <td className="py-2 pr-4 text-right font-data text-[13px] tabular-nums">
                                                {row.items}
                                            </td>
                                            <td className="py-2">
                                                {row.best_seller}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        </>
    );
}

ReportIndex.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
        {
            title: 'Laporan',
            href: reports(),
        },
    ],
};
