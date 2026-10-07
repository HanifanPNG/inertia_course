import { Form, Head, Link } from '@inertiajs/react';
import { Printer } from 'lucide-react';
import { useState } from 'react';
import { DatePicker } from '@/components/date-picker';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatAmount } from '@/lib/format';
import PosLayout from '@/layouts/cashier/pos-layout';
import {
    create,
    index,
    print as printStruk,
    show,
} from '@/routes/cashier/orders';

export type OrderSummary = {
    transactions: number;
    items: number;
    revenue: number;
};

export type OrderListItem = {
    id: number;
    order_number: number;
    order_date: string;
    total_amount: string;
    status: string;
    items_count: number;
    can_be_printed: boolean;
    user: {
        name: string;
    };
};

const statusVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
    pending: 'outline',
    paid: 'default',
    completed: 'secondary',
};

export default function OrdersIndex({
    orders,
    filters,
    summary,
}: {
    orders: OrderListItem[];
    filters: { order_date: string | null };
    summary: OrderSummary;
}) {
    const [orderDate, setOrderDate] = useState<string | null>(
        filters.order_date,
    );

    return (
        <>
            <Head title="Transaksi" />

            <h1 className="sr-only">Transaksi</h1>

            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <Heading
                        title="Transaksi"
                        description="Daftar pesanan yang dibuat kasir"
                    />

                    <Button asChild>
                        <Link href={create()}>Transaksi Baru</Link>
                    </Button>
                </div>

                <Form
                    action={index()}
                    method="get"
                    options={{ preserveScroll: true }}
                    className="flex flex-wrap items-end gap-3"
                >
                    {({ errors }) => (
                        <div className="space-y-3">
                            <div className="flex flex-wrap items-end gap-3">
                                <div className="grid gap-1.5">
                                    <span className="font-data text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
                                        Tanggal
                                    </span>

                                    <DatePicker
                                        name="order_date"
                                        id="order_date"
                                        value={orderDate}
                                        onChange={setOrderDate}
                                        ariaLabel="Pilih tanggal transaksi"
                                        className="w-56"
                                    />
                                </div>

                                <Button type="submit" variant="outline">
                                    Terapkan
                                </Button>
                            </div>

                            {errors.order_date && (
                                <p className="text-sm text-destructive">
                                    {errors.order_date}
                                </p>
                            )}
                        </div>
                    )}
                </Form>

                <p className="font-data text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
                    {filters.order_date
                        ? `${summary.transactions} transaksi · ${summary.items} item · Rp ${formatAmount(summary.revenue)} pada ${formatDateLabel(filters.order_date)}`
                        : `Semua tanggal: ${summary.transactions} transaksi · ${summary.items} item · Rp ${formatAmount(summary.revenue)}`}
                </p>

                {orders.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        Belum ada transaksi.{' '}
                        <Link
                            href={create()}
                            className="underline underline-offset-4"
                        >
                            Buat transaksi baru
                        </Link>
                        .
                    </p>
                ) : (
                    <div className="overflow-x-auto border border-border">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-foreground/25 font-data text-[10.5px] tracking-[0.2em] text-muted-foreground uppercase">
                                <tr>
                                    <th className="px-4 py-3 font-medium">
                                        Nomor
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Tanggal
                                    </th>
                                    <th className="px-4 py-3 text-right font-medium">
                                        Item
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Kasir
                                    </th>
                                    <th className="px-4 py-3 text-right font-medium">
                                        Total
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-right font-medium">
                                        Struk
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => (
                                    <tr
                                        key={order.id}
                                        className="border-b border-border last:border-b-0"
                                    >
                                        <td className="px-4 py-3">
                                            <Link
                                                href={show({
                                                    order: order.id,
                                                })}
                                                className="font-medium underline underline-offset-4"
                                            >
                                                #{order.order_number}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3 font-data text-[13px] text-muted-foreground tabular-nums">
                                            {order.order_date}
                                        </td>
                                        <td className="px-4 py-3 text-right font-data text-[13px] text-muted-foreground tabular-nums">
                                            {order.items_count}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {order.user.name}
                                        </td>
                                        <td className="px-4 py-3 text-right font-data text-[13px] tabular-nums">
                                            Rp{' '}
                                            {formatAmount(order.total_amount)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge
                                                variant={
                                                    statusVariant[
                                                        order.status
                                                    ] ?? 'outline'
                                                }
                                            >
                                                {order.status}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {order.can_be_printed && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    asChild
                                                >
                                                    <a
                                                        href={printStruk.url({
                                                            order: order.id,
                                                        })}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        <Printer className="mr-2 h-4 w-4" />
                                                        Cetak
                                                    </a>
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}

OrdersIndex.layout = (page: React.ReactNode) => <PosLayout>{page}</PosLayout>;

function formatDateLabel(value: string): string {
    const [year, month, day] = value.split('-');

    return `${day}/${month}/${year}`;
}
