import { Form, Head } from '@inertiajs/react';
import { useState } from 'react';
import OrderController from '@/actions/App/Http/Controllers/Cashier/OrderController';
import MenuGrid, {
    orderedCategories,
    type MenuCategory,
    type MenuProduct,
} from '@/components/menu-grid';
import {
    PosCart,
    type CartLine,
    type PaymentMethodOption,
} from '@/components/pos-cart';
import PosLayout from '@/layouts/cashier/pos-layout';

export default function CashierDashboard({
    categories,
    paymentMethods,
    qrisImageUrl,
}: {
    categories: MenuCategory[];
    paymentMethods: PaymentMethodOption[];
    qrisImageUrl: string;
}) {
    const [lines, setLines] = useState<CartLine[]>([]);
    const [categoryId, setCategoryId] = useState<number | null>(
        () => orderedCategories(categories)[0]?.id ?? null,
    );
    const [method, setMethod] = useState('cash');
    const [amountPaid, setAmountPaid] = useState('');
    const [clientName, setClientName] = useState('');

    const addProduct = (product: MenuProduct) => {
        setLines((current) => {
            const existing = current.find(
                (line) => line.product.id === product.id,
            );

            if (existing) {
                return current.map((line) =>
                    line.product.id === product.id
                        ? { ...line, quantity: line.quantity + 1 }
                        : line,
                );
            }

            return [...current, { product, quantity: 1 }];
        });
    };

    const changeQuantity = (productId: number, quantity: number) => {
        setLines((current) =>
            quantity < 1
                ? current.filter((line) => line.product.id !== productId)
                : current.map((line) =>
                      line.product.id === productId
                          ? { ...line, quantity }
                          : line,
                  ),
        );
    };

    const quantityFor = (productId: number) =>
        lines.find((line) => line.product.id === productId)?.quantity ?? 0;

    const removeProduct = (productId: number) =>
        changeQuantity(productId, quantityFor(productId) - 1);

    const total = lines.reduce(
        (sum, line) => sum + Number(line.product.price) * line.quantity,
        0,
    );

    const isCash = method === 'cash';
    const cashIsEnough =
        isCash && amountPaid !== '' && Number(amountPaid) - total >= 0;
    const hasClientName = clientName.trim().length > 0;
    const canSubmit =
        lines.length > 0 && hasClientName && (isCash ? cashIsEnough : true);

    const resetCart = () => {
        setLines([]);
        setAmountPaid('');
        setClientName('');
        setMethod('cash');
    };

    return (
        <>
            <Head title="Kasir" />

            <h1 className="sr-only">Kasir</h1>

            <Form
                {...OrderController.checkout.form()}
                options={{ preserveScroll: true }}
                onSuccess={resetCart}
                className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)] xl:gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <MenuGrid
                            menu={categories}
                            activeCategoryId={categoryId}
                            onCategoryChange={setCategoryId}
                            quantityFor={quantityFor}
                            onAdd={addProduct}
                            onRemove={removeProduct}
                        />

                        <PosCart
                            lines={lines}
                            total={total}
                            clientName={clientName}
                            clientNameError={errors.client_name}
                            onClientNameChange={setClientName}
                            method={method}
                            paymentMethods={paymentMethods}
                            onMethodChange={(value) => {
                                setMethod(value);
                                setAmountPaid('');
                            }}
                            amountPaid={amountPaid}
                            onAmountPaidChange={setAmountPaid}
                            amountPaidError={errors.amount_paid}
                            qrisImageUrl={qrisImageUrl}
                            itemsError={errors.items}
                            paymentMethodError={errors.payment_method}
                            canSubmit={canSubmit}
                            processing={processing}
                            onClear={resetCart}
                            onQuantityChange={changeQuantity}
                        />
                    </>
                )}
            </Form>
        </>
    );
}

CashierDashboard.layout = (page: React.ReactNode) => (
    <PosLayout>{page}</PosLayout>
);
