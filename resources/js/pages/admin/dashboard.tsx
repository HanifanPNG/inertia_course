import { Head, Link } from '@inertiajs/react';
import {
    Banknote,
    Receipt,
    ShoppingBasket,
    Trophy,
    Wallet,
} from 'lucide-react';
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

const stats = (
    summary: DashboardSummary,
): Array<{
    title: string;
    value: string;
    description: string;
    icon: typeof Banknote;
}> => [
    {
        title: 'Pendapatan',
        value: formatCurrency(summary.revenue),
        description: 'Total hari ini',
        icon: Banknote,
    },
    {
        title: 'Transaksi',
        value: String(summary.transactions),
        description: 'Pesanan hari ini',
        icon: Receipt,
    },
    {
        title: 'Item Terjual',
        value: String(summary.items_sold),
        description: 'Total porsi hari ini',
        icon: ShoppingBasket,
    },
    {
        title: 'Pesanan Dibayar',
        value: String(summary.paid_orders),
        description: 'Sudah lunas hari ini',
        icon: Wallet,
    },
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

            <div className="mb-8 flex items-start justify-between gap-4">
                <Heading
                    title="Dashboard Hari Ini"
                    description="Ringkasan penjualan restoran hari ini"
                />

                <Button asChild variant="outline">
                    <Link href={reports()}>Lihat Laporan</Link>
                </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {stats(summary).map((stat) => (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {stat.title}
                            </CardTitle>
                            <stat.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-semibold">
                                {stat.value}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {stat.description}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="mt-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-4 w-4" />
                        Menu Terlaris
                    </CardTitle>
                    <CardDescription>
                        Berdasarkan jumlah porsi terjual hari ini
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {bestSellers.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            Belum ada penjualan hari ini.
                        </p>
                    ) : (
                        <ol className="space-y-3">
                            {bestSellers.map((product, index) => (
                                <li
                                    key={`${product.name}-${index}`}
                                    className="flex items-center justify-between gap-4 text-sm"
                                >
                                    <span className="flex items-center gap-3">
                                        <span className="w-6 text-right font-medium text-muted-foreground tabular-nums">
                                            {index + 1}
                                        </span>
                                        <span className="font-medium">
                                            {product.name}
                                        </span>
                                    </span>
                                    <span className="text-muted-foreground tabular-nums">
                                        {product.quantity} porsi
                                    </span>
                                </li>
                            ))}
                        </ol>
                    )}
                </CardContent>
            </Card>
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
