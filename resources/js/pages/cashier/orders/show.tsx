import { Form, Head, Link } from '@inertiajs/react';
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
import { formatCurrency } from '@/lib/format';
import { edit, index } from '@/routes/cashier/orders';

export type OrderDetail = {
    id: number;
    order_number: number;
    order_date: string;
    total_amount: string;
    status: string;
    can_be_completed: boolean;
    can_be_edited: boolean;
    can_be_deleted: boolean;
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

                        <Button variant="outline" asChild>
                            <Link href={index()}>Kembali</Link>
                        </Button>
                    </div>
                </div>

                <div className="max-w-xl rounded-xl border border-sidebar-border/70 p-6 dark:border-sidebar-border">
                    <div className="space-y-1 text-center">
                        <p className="text-sm font-medium uppercase">
                            Nama Cafe
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Struk transaksi
                        </p>
                    </div>

                    <hr className="my-4 border-dashed border-sidebar-border dark:border-sidebar-border" />

                    <div className="flex items-center justify-between text-sm">
                        <span>Nomor Pesanan</span>
                        <span className="text-lg font-bold">
                            #{order.order_number}
                        </span>
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Tanggal</span>
                        <span>{order.order_date}</span>
                    </div>

                    <hr className="my-4 border-dashed border-sidebar-border dark:border-sidebar-border" />

                    <div className="space-y-2">
                        {order.items.map((item, itemIndex) => (
                            <div
                                key={itemIndex}
                                className="flex items-start justify-between gap-4 text-sm"
                            >
                                <span className="text-muted-foreground">
                                    {item.product_name} x{item.quantity}
                                </span>

                                <span className="font-medium">
                                    {formatCurrency(item.subtotal)}
                                </span>
                            </div>
                        ))}
                    </div>

                    <hr className="my-4 border-dashed border-sidebar-border dark:border-sidebar-border" />

                    <div className="flex items-center justify-between text-base font-semibold">
                        <span>TOTAL</span>
                        <span>{formatCurrency(order.total_amount)}</span>
                    </div>

                    <hr className="my-4 border-dashed border-sidebar-border dark:border-sidebar-border" />

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

OrderShow.layout = {
    breadcrumbs: [
        { title: 'Transaksi', href: index() },
        { title: 'Detail', href: index() },
    ],
};
