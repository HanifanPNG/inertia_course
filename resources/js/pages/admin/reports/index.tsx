import { Head, router } from '@inertiajs/react';
import { Download, Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { formatCurrency } from '@/lib/format';
import { dashboard } from '@/routes/admin';
import { exportMethod, index as reports } from '@/routes/admin/reports';

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

const stats = (summary: ReportSummary) => [
    { title: 'Pendapatan', value: formatCurrency(summary.revenue) },
    { title: 'Transaksi', value: String(summary.transactions) },
    { title: 'Pesanan Dibayar', value: String(summary.paid_orders) },
    { title: 'Item Terjual', value: String(summary.items_sold) },
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

            <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
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

            <div className="mb-6 flex flex-wrap items-end gap-3">
                <div className="flex overflow-hidden rounded-md border">
                    {(['daily', 'monthly'] as const).map((period) => (
                        <button
                            key={period}
                            type="button"
                            onClick={() =>
                                goto({
                                    period,
                                    ...(period === 'daily'
                                        ? { date: filters.date }
                                        : { month: filters.month }),
                                })
                            }
                            className={
                                'px-4 py-2 text-sm font-medium ' +
                                (filters.period === period
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:bg-muted')
                            }
                        >
                            {period === 'daily' ? 'Harian' : 'Bulanan'}
                        </button>
                    ))}
                </div>

                <label className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">
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
                        className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
                    />
                </label>

                <span className="text-sm text-muted-foreground">
                    {filters.period === 'daily'
                        ? `Tanggal ${filters.date}`
                        : `Bulan ${filters.month}`}
                </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {stats(report.summary).map((stat) => (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {stat.title}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-semibold tabular-nums">
                                {stat.value}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Trophy className="h-4 w-4" />
                            Menu Terlaris
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {report.summary.best_seller ? (
                            <p className="text-sm">
                                <span className="font-medium">
                                    {report.summary.best_seller.name}
                                </span>{' '}
                                <span className="text-muted-foreground">
                                    ({report.summary.best_seller.quantity}{' '}
                                    porsi)
                                </span>
                            </p>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                Belum ada penjualan.
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Metode Pembayaran</CardTitle>
                        <CardDescription>
                            Total penerimaan per metode
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {report.summary.payments.map((payment) => (
                            <div
                                key={payment.method}
                                className="flex items-center justify-between gap-4 text-sm"
                            >
                                <span>{payment.label}</span>
                                <span className="text-muted-foreground tabular-nums">
                                    {formatCurrency(payment.amount)}
                                </span>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Rincian Harian</CardTitle>
                    <CardDescription>
                        {filters.period === 'daily'
                            ? 'Detail transaksi pada tanggal terpilih'
                            : 'Detail transaksi sepanjang bulan terpilih'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {report.rows.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            Tidak ada transaksi pada periode ini.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b text-left text-muted-foreground">
                                        <th className="py-2 pr-4 font-medium">
                                            Tanggal
                                        </th>
                                        <th className="py-2 pr-4 font-medium">
                                            Transaksi
                                        </th>
                                        <th className="py-2 pr-4 font-medium">
                                            Dibayar
                                        </th>
                                        <th className="py-2 pr-4 font-medium">
                                            Pendapatan
                                        </th>
                                        <th className="py-2 pr-4 font-medium">
                                            Item
                                        </th>
                                        <th className="py-2 font-medium">
                                            Terlaris
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {report.rows.map((row) => (
                                        <tr
                                            key={row.date}
                                            className="border-b last:border-0"
                                        >
                                            <td className="py-2 pr-4 tabular-nums">
                                                {row.date}
                                            </td>
                                            <td className="py-2 pr-4 tabular-nums">
                                                {row.transactions}
                                            </td>
                                            <td className="py-2 pr-4 tabular-nums">
                                                {row.paid_orders}
                                            </td>
                                            <td className="py-2 pr-4 tabular-nums">
                                                {formatCurrency(row.revenue)}
                                            </td>
                                            <td className="py-2 pr-4 tabular-nums">
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
                </CardContent>
            </Card>
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
