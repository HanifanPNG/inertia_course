import { Head, Link, usePoll } from '@inertiajs/react';
import Heading from '@/components/heading';
import { display } from '@/routes/orders';

export type DisplayOrder = {
    id: number;
    number: number;
    status: 'pending' | 'paid' | 'completed';
    status_label: string;
};

type DisplayFilter = {
    value: string;
    label: string;
};

const statusStyles: Record<DisplayOrder['status'], string> = {
    pending: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
    paid: 'bg-sky-500/15 text-sky-700 dark:text-sky-400',
    completed: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
};

export default function OrdersDisplay({
    orders,
    counts,
    filter,
    filters,
}: {
    orders: DisplayOrder[];
    counts: Record<string, number>;
    filter: string;
    filters: DisplayFilter[];
}) {
    usePoll(5000, { only: ['orders', 'counts'] });

    return (
        <>
            <Head title="Order Display" />

            <h1 className="sr-only">Order Display</h1>

            <Heading
                title="Order Display"
                description={`Pesanan hari ini · diperbarui otomatis setiap 5 detik · ${todayLabel()}`}
            />

            <div className="mb-6 flex flex-wrap gap-2">
                {filters.map((item) => (
                    <Link
                        key={item.value}
                        href={display({ query: { status: item.value } })}
                        prefetch
                        className={
                            'flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium ' +
                            (filter === item.value
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:bg-muted')
                        }
                    >
                        {item.label}
                        <span className="text-xs tabular-nums opacity-70">
                            {counts[item.value] ?? 0}
                        </span>
                    </Link>
                ))}
            </div>

            {orders.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                    Belum ada pesanan pada filter ini.
                </p>
            ) : (
                <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {orders.map((order) => (
                        <li
                            key={order.id}
                            className="flex items-center justify-between gap-4 rounded-xl border p-4"
                        >
                            <span className="font-mono text-3xl font-semibold tracking-tight tabular-nums">
                                #{order.number}
                            </span>
                            <span
                                className={
                                    'rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase ' +
                                    statusStyles[order.status]
                                }
                            >
                                {order.status_label}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </>
    );
}

function todayLabel(): string {
    return new Intl.DateTimeFormat('id-ID', { dateStyle: 'full' }).format(
        new Date(),
    );
}

OrdersDisplay.layout = {
    breadcrumbs: [
        {
            title: 'Order Display',
            href: display(),
        },
    ],
};
