import { Head } from '@inertiajs/react';
import OrderController from '@/actions/App/Http/Controllers/Cashier/OrderController';
import Heading from '@/components/heading';
import OrderCart, {
    type MenuCategory,
    type OrderLine,
} from '@/components/order-cart';
import { Button } from '@/components/ui/button';
import { index } from '@/routes/cashier/orders';

export type EditableOrder = {
    id: number;
    order_number: number;
    order_date: string;
    total_amount: string;
};

export default function OrderEdit({
    order,
    categories,
    items,
}: {
    order: EditableOrder;
    categories: MenuCategory[];
    items: { product_id: number; quantity: number }[];
}) {
    const lines: OrderLine[] = items.flatMap((item) => {
        const product = categories
            .flatMap((category) => category.products)
            .find((menuProduct) => menuProduct.id === item.product_id);

        return product ? [{ product, quantity: item.quantity }] : [];
    });

    return (
        <>
            <Head title={`Ubah Pesanan #${order.order_number}`} />

            <h1 className="sr-only">Ubah Pesanan</h1>

            <div className="space-y-6">
                <Heading
                    title={`Ubah Pesanan #${order.order_number}`}
                    description={`${order.order_date} · total saat ini ${order.total_amount}`}
                />

                <OrderCart
                    action={OrderController.update.form({ order: order.id })}
                    menu={categories}
                    initialLines={lines}
                    cancelHref={index().url}
                >
                    {({ processing }) => (
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={processing}
                        >
                            Simpan Perubahan
                        </Button>
                    )}
                </OrderCart>
            </div>
        </>
    );
}

OrderEdit.layout = {
    breadcrumbs: [
        { title: 'Transaksi', href: index() },
        { title: 'Ubah', href: index() },
    ],
};
