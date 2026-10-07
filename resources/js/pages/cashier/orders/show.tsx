import { Form, Head, Link, usePage } from '@inertiajs/react';
import { Printer } from 'lucide-react';
import OrderController from '@/actions/App/Http/Controllers/Cashier/OrderController';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { formatAmount } from '@/lib/format';
import PosLayout from '@/layouts/cashier/pos-layout';
import { edit, index, print as printStruk } from '@/routes/cashier/orders';

export type OrderDetail = {
    id: number;
    order_number: number;
    order_date: string;
    time: string;
    client_name: string;
    total_amount: string;
    status: string;
    can_be_completed: boolean;
    can_be_edited: boolean;
    can_be_deleted: boolean;
    can_be_printed: boolean;
    user: { name: string };
    items: {
        quantity: number;
        price: string;
        subtotal: string;
        product_name: string;
    }[];
};

const statusVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
    pending: 'outline',
    paid: 'default',
    completed: 'secondary',
};

export default function OrderShow({ order }: { order: OrderDetail }) {
    const { name } = usePage().props as { name: string };

    return (
        <>
            <Head title={`Pesanan #${order.order_number}`} />

            <h1 className="sr-only">Pesanan #{order.order_number}</h1>

            <div className="space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <Heading
                        title={`Pesanan #${order.order_number}`}
                        description={`${order.order_date} · Kasir ${order.user.name}`}
                    />

                    <div className="flex flex-wrap items-center gap-2">
                        <Badge
                            variant={statusVariant[order.status] ?? 'outline'}
                        >
                            {order.status}
                        </Badge>

                        {order.can_be_edited && (
                            <Button variant="outline" asChild>
                                <Link href={edit({ order: order.id })}>
                                    Ubah
                                </Link>
                            </Button>
                        )}

                        {order.can_be_deleted && (
                            <OrderDeleteDialog order={order} />
                        )}

                        {order.can_be_printed && (
                            <Button asChild>
                                <a
                                    href={printStruk.url({
                                        order: order.id,
                                    })}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Printer className="mr-2 h-4 w-4" />
                                    Cetak Struk
                                </a>
                            </Button>
                        )}

                        <Button variant="outline" asChild>
                            <Link href={index()}>Kembali</Link>
                        </Button>
                    </div>
                </div>

                <div className="max-w-xl border border-border bg-card p-6">
                    <div className="space-y-1 text-center">
                        <p className="text-sm font-medium uppercase">{name}</p>
                        <p className="text-xs text-muted-foreground">
                            Struk transaksi
                        </p>
                    </div>

                    <hr className="my-4 border-dashed border-border" />

                    <div className="flex items-center justify-between text-sm">
                        <span>Nomor Pesanan</span>
                        <span className="font-data text-lg font-bold tabular-nums">
                            #{order.order_number}
                        </span>
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Tanggal</span>
                        <span className="font-data text-[13px] tabular-nums">
                            {order.order_date}
                        </span>
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Waktu</span>
                        <span>{order.time} WIB</span>
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Pelanggan</span>
                        <span>{order.client_name || '-'}</span>
                    </div>

                    <hr className="my-4 border-dashed border-border" />

                    <div className="space-y-2">
                        {order.items.map((item, itemIndex) => (
                            <div
                                key={itemIndex}
                                className="flex items-start justify-between gap-4 text-sm"
                            >
                                <span className="text-muted-foreground">
                                    {item.product_name} x{item.quantity}
                                </span>

                                <span className="font-data tabular-nums">
                                    {formatAmount(item.subtotal)}
                                </span>
                            </div>
                        ))}
                    </div>

                    <hr className="my-4 border-dashed border-border" />

                    <div className="flex items-baseline justify-between border-t-2 border-foreground/80 pt-3 text-base font-semibold">
                        <span className="font-data text-[11px] tracking-[0.2em] uppercase">
                            Total
                        </span>
                        <span className="font-data tabular-nums">
                            Rp {formatAmount(order.total_amount)}
                        </span>
                    </div>

                    <hr className="my-4 border-dashed border-border" />

                    <p className="text-center text-xs text-muted-foreground">
                        Terima kasih!
                    </p>
                </div>

                {order.can_be_completed && (
                    <Form
                        {...OrderController.updateStatus.form({
                            order: order.id,
                        })}
                        options={{ preserveScroll: true }}
                    >
                        {({ processing }) => (
                            <Button type="submit" disabled={processing}>
                                Tandai Sudah Disajikan
                            </Button>
                        )}
                    </Form>
                )}
            </div>
        </>
    );
}

function OrderDeleteDialog({ order }: { order: OrderDetail }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="destructive">Hapus</Button>
            </DialogTrigger>

            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        Hapus pesanan #{order.order_number}?
                    </DialogTitle>
                    <DialogDescription>
                        Hanya pesanan dengan status pending yang dapat dihapus.
                        Tindakan ini tidak dapat dibatalkan.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    {...OrderController.destroy.form({ order: order.id })}
                    options={{ preserveScroll: true }}
                >
                    {({ processing }) => (
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline" disabled={processing}>
                                    Batal
                                </Button>
                            </DialogClose>

                            <Button
                                variant="destructive"
                                type="submit"
                                disabled={processing}
                            >
                                Hapus
                            </Button>
                        </DialogFooter>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

OrderShow.layout = (page: React.ReactNode) => <PosLayout>{page}</PosLayout>;
