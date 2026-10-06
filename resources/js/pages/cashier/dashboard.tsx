import { Form, Head, Link } from '@inertiajs/react';
import { Banknote, QrCode, ShoppingCart, Smartphone } from 'lucide-react';
import { useState } from 'react';
import OrderController from '@/actions/App/Http/Controllers/Cashier/OrderController';
import Heading from '@/components/heading';
import MenuGrid, {
    type MenuCategory,
    type MenuProduct,
} from '@/components/menu-grid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/format';
import { dashboard as cashierDashboard } from '@/routes/cashier';
import { index } from '@/routes/cashier/orders';

type PaymentMethodOption = {
    value: string;
    label: string;
};

type CartLine = {
    product: MenuProduct;
    quantity: number;
};

const methodIcons: Record<string, typeof Banknote> = {
    cash: Banknote,
    qris: QrCode,
    debit: Smartphone,
};

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

    const paid = Number(amountPaid);
    const change = paid - total;
    const isCash = method === 'cash';
    const cashIsEnough = isCash && amountPaid !== '' && change >= 0;
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

            <div className="space-y-6">
                <Heading
                    title="Kasir"
                    description="Pilih menu, pilih pembayaran, lalu selesaikan pesanan"
                />

                <Form
                    {...OrderController.checkout.form()}
                    options={{ preserveScroll: true }}
                    onSuccess={resetCart}
                    className="grid gap-6 lg:grid-cols-[2fr_1fr]"
                >
                    {({ processing, errors }) => (
                        <>
                            <MenuGrid
                                menu={categories}
                                quantityFor={quantityFor}
                                onAdd={addProduct}
                                onRemove={removeProduct}
                            />

                            <div className="space-y-4 rounded-xl border border-sidebar-border/70 p-4 lg:sticky lg:top-4 lg:self-start dark:border-sidebar-border">
                                <h2 className="text-sm font-medium">
                                    Pesanan Saat Ini
                                </h2>

                                {lines.length === 0 ? (
                                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <ShoppingCart className="size-4" />
                                        Keranjang masih kosong.
                                    </p>
                                ) : (
                                    <>
                                        {lines.map((line) => (
                                            <div
                                                key={line.product.id}
                                                className="flex items-center justify-between gap-2 text-sm"
                                            >
                                                <input
                                                    type="hidden"
                                                    name={`items[${line.product.id}][product_id]`}
                                                    value={line.product.id}
                                                />

                                                <span className="text-muted-foreground">
                                                    {line.product.name} x
                                                    <input
                                                        type="number"
                                                        name={`items[${line.product.id}][quantity]`}
                                                        min="1"
                                                        value={line.quantity}
                                                        onChange={(event) =>
                                                            changeQuantity(
                                                                line.product.id,
                                                                Number(
                                                                    event.target
                                                                        .value,
                                                                ),
                                                            )
                                                        }
                                                        className="mx-1 w-14 rounded-md border border-input bg-transparent px-2 py-1 text-center text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                                    />
                                                </span>

                                                <span className="font-medium">
                                                    {formatCurrency(
                                                        Number(
                                                            line.product.price,
                                                        ) * line.quantity,
                                                    )}
                                                </span>
                                            </div>
                                        ))}

                                        <div className="flex items-center justify-between border-t border-sidebar-border/70 pt-3 text-sm font-medium dark:border-sidebar-border">
                                            <span>Total</span>
                                            <span>{formatCurrency(total)}</span>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="client_name">
                                                Nama Pelanggan
                                            </Label>

                                            <Input
                                                id="client_name"
                                                name="client_name"
                                                value={clientName}
                                                onChange={(event) =>
                                                    setClientName(
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Contoh: Budi"
                                                autoComplete="off"
                                            />

                                            {errors.client_name && (
                                                <p className="text-sm text-red-600 dark:text-red-400">
                                                    {errors.client_name}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2 rounded-lg border border-sidebar-border/70 p-3 dark:border-sidebar-border">
                                            <p className="text-sm font-medium">
                                                Pembayaran
                                            </p>

                                            <div className="grid grid-cols-3 gap-2">
                                                {paymentMethods.map(
                                                    (option) => {
                                                        const Icon =
                                                            methodIcons[
                                                                option.value
                                                            ] ?? Banknote;

                                                        return (
                                                            <button
                                                                key={
                                                                    option.value
                                                                }
                                                                type="button"
                                                                onClick={() => {
                                                                    setMethod(
                                                                        option.value,
                                                                    );
                                                                    setAmountPaid(
                                                                        '',
                                                                    );
                                                                }}
                                                                className={
                                                                    'flex flex-col items-center gap-1 rounded-md border px-2 py-2 text-xs font-medium transition-colors ' +
                                                                    (method ===
                                                                    option.value
                                                                        ? 'border-primary bg-primary/10 text-primary'
                                                                        : 'border-input text-muted-foreground hover:bg-accent')
                                                                }
                                                            >
                                                                <Icon className="size-4" />
                                                                {option.label}
                                                            </button>
                                                        );
                                                    },
                                                )}
                                            </div>

                                            <input
                                                type="hidden"
                                                name="payment_method"
                                                value={method}
                                            />

                                            {isCash && (
                                                <div className="space-y-2">
                                                    <Label htmlFor="amount_paid">
                                                        Uang Diterima
                                                    </Label>

                                                    <Input
                                                        id="amount_paid"
                                                        name="amount_paid"
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={amountPaid}
                                                        onChange={(event) =>
                                                            setAmountPaid(
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                        placeholder="0"
                                                    />

                                                    {amountPaid !== '' &&
                                                        change >= 0 && (
                                                            <p className="text-sm text-muted-foreground">
                                                                Kembalian:{' '}
                                                                <span className="font-medium text-foreground">
                                                                    {formatCurrency(
                                                                        change,
                                                                    )}
                                                                </span>
                                                            </p>
                                                        )}

                                                    {amountPaid !== '' &&
                                                        change < 0 && (
                                                            <p className="text-sm text-red-600 dark:text-red-400">
                                                                Uang kurang{' '}
                                                                {formatCurrency(
                                                                    Math.abs(
                                                                        change,
                                                                    ),
                                                                )}
                                                            </p>
                                                        )}

                                                    {amountPaid !== '' &&
                                                        change === 0 && (
                                                            <p className="text-sm text-green-600 dark:text-green-400">
                                                                Uang pas
                                                            </p>
                                                        )}

                                                    {errors.amount_paid && (
                                                        <p className="text-sm text-red-600 dark:text-red-400">
                                                            {errors.amount_paid}
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            {method === 'qris' && (
                                                <div className="space-y-2 text-center">
                                                    <img
                                                        src={qrisImageUrl}
                                                        alt="QRIS pembayaran"
                                                        className="mx-auto h-48 w-48 rounded-lg border border-sidebar-border/70 object-contain dark:border-sidebar-border"
                                                    />
                                                    <p className="text-xs text-muted-foreground">
                                                        Minta customer scan QRIS
                                                        sebesar{' '}
                                                        {formatCurrency(total)}
                                                    </p>
                                                </div>
                                            )}

                                            {method === 'debit' && (
                                                <p className="text-xs text-muted-foreground">
                                                    Proses kartu debit sebesar{' '}
                                                    {formatCurrency(total)},
                                                    lalu tekan Selesaikan.
                                                </p>
                                            )}

                                            {errors.payment_method && (
                                                <p className="text-sm text-red-600 dark:text-red-400">
                                                    {errors.payment_method}
                                                </p>
                                            )}
                                        </div>

                                        {errors.items && (
                                            <p className="text-sm text-red-600 dark:text-red-400">
                                                {errors.items}
                                            </p>
                                        )}

                                        <Button
                                            type="submit"
                                            className="w-full"
                                            disabled={processing || !canSubmit}
                                        >
                                            Selesaikan &amp; Bayar
                                        </Button>

                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full"
                                            onClick={resetCart}
                                            disabled={processing}
                                        >
                                            Kosongkan Keranjang
                                        </Button>

                                        <p className="text-center text-xs text-muted-foreground">
                                            Lihat daftar transaksi di halaman{' '}
                                            <Link
                                                href={index()}
                                                className="underline underline-offset-4"
                                            >
                                                Transaksi
                                            </Link>
                                            .
                                        </p>
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}

CashierDashboard.layout = {
    breadcrumbs: [
        {
            title: 'Kasir',
            href: cashierDashboard().url,
        },
    ],
};
