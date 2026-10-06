import { Form, Head, Link } from '@inertiajs/react';
import { Printer } from 'lucide-react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/format';
import {
    create,
    index,
    print as printStruk,
    show,
} from '@/routes/cashier/orders';

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
}: {
    orders: OrderListItem[];
    filters: { order_date: string | null };
}) {
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
                        <>
                            <div className="grid gap-2">
                                <label
                                    htmlFor="order_date"
                                    className="text-sm font-medium"
                                >
                                    Tanggal
                                </label>

                                <input
                                    id="order_date"
                                    name="order_date"
                                    type="date"
                                    defaultValue={filters.order_date ?? ''}
                                    className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                />
                            </div>

                            <Button type="submit" variant="secondary">
                                Filter
                            </Button>

                            {errors.order_date && (
                                <p className="text-sm text-red-600 dark:text-red-400">
                                    {errors.order_date}
                                </p>
                            )}
                        </>
                    )}
                </Form>

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
                    <div className="overflow-x-auto rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-sidebar-border/70 text-xs text-muted-foreground dark:border-sidebar-border">
                                <tr>
                                    <th className="px-4 py-3 font-medium">
                                        Nomor
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Tanggal
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Item
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Kasir
                                    </th>
                                    <th className="px-4 py-3 font-medium">
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
                            <tbody className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                                {orders.map((order) => (
                                    <tr key={order.id}>
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
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {order.order_date}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {order.items_count}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {order.user.name}
                                        </td>
                                        <td className="px-4 py-3">
                                            {formatCurrency(order.total_amount)}
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

OrdersIndex.layout = {
    breadcrumbs: [
        {
            title: 'Transaksi',
            href: index(),
        },
    ],
};
