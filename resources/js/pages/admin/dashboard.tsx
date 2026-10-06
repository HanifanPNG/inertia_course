import { Head, Link } from '@inertiajs/react';
import Heading from '@/components/heading';
import { LedgerStats } from '@/components/ledger-stats';
import type { LedgerStat } from '@/components/ledger-stats';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/format';
import { dashboard } from '@/routes/admin';
import { index as reports } from '@/routes/admin/reports';

export type DashboardSummary = {
    revenue: string;
    transactions: number;
    items_sold: number;
    paid_orders: number;
};

export type BestSeller = {
    name: string;
    quantity: number;
};

const stats = (summary: DashboardSummary): LedgerStat[] => [
    { label: 'Pendapatan', value: formatCurrency(summary.revenue) },
    { label: 'Transaksi', value: String(summary.transactions) },
    { label: 'Item Terjual', value: String(summary.items_sold) },
    { label: 'Pesanan Dibayar', value: String(summary.paid_orders) },
];

export default function AdminDashboard({
    summary,
    bestSellers,
}: {
    summary: DashboardSummary;
    bestSellers: BestSeller[];
}) {
    return (
        <>
            <Head title="Admin Dashboard" />

            <h1 className="sr-only">Admin Dashboard</h1>

            <div>
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <Heading
                        title="Dashboard Hari Ini"
                        description="Ringkasan penjualan restoran hari ini"
                    />

                    <Button asChild>
                        <Link href={reports()}>Lihat Laporan</Link>
                    </Button>
                </div>

                <div aria-hidden="true" className="bon-rule mt-4 sm:mt-1" />

                <LedgerStats stats={stats(summary)} className="mt-6" />

                <section aria-labelledby="menu-terlaris" className="mt-10">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                        <h2
                            id="menu-terlaris"
                            className="font-data text-[11px] tracking-[0.24em] uppercase"
                        >
                            Menu Terlaris
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            Berdasarkan jumlah porsi terjual hari ini
                        </p>
                    </div>

                    {bestSellers.length === 0 ? (
                        <p className="mt-4 text-sm text-muted-foreground">
                            Belum ada penjualan hari ini.
                        </p>
                    ) : (
                        <ol className="mt-3 border-t border-border">
                            {bestSellers.map((product, index) => (
                                <li
                                    key={`${product.name}-${index}`}
                                    className="flex items-baseline gap-3 border-b border-border py-2.5"
                                >
                                    <span className="text-data w-5 shrink-0 text-right font-data text-[11px] tabular-nums">
                                        {index + 1}
                                    </span>
                                    <span className="min-w-0 truncate text-sm font-medium">
                                        {product.name}
                                    </span>
                                    <span
                                        aria-hidden="true"
                                        className="mx-1 min-w-4 flex-1 translate-y-[-3px] border-b border-dotted border-border"
                                    />
                                    <span className="shrink-0 font-data text-sm text-foreground tabular-nums">
                                        {product.quantity} porsi
                                    </span>
                                </li>
                            ))}
                        </ol>
                    )}
                </section>
            </div>
        </>
    );
}

AdminDashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
