import { Minus, Plus, X } from 'lucide-react';
import type { MenuProduct } from '@/components/menu-grid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatAmount } from '@/lib/format';
import { cn } from '@/lib/utils';

export type CartLine = {
    product: MenuProduct;
    quantity: number;
};

export type PaymentMethodOption = {
    value: string;
    label: string;
};

const cashPresets = (total: number): number[] =>
    [
        ...new Set(
            [total, 20_000, 50_000, 100_000, 200_000].filter(
                (value) => value >= total,
            ),
        ),
    ].slice(0, 5);

export function PosCart({
    lines,
    total,
    clientName,
    clientNameError,
    onClientNameChange,
    method,
    paymentMethods,
    onMethodChange,
    amountPaid,
    onAmountPaidChange,
    amountPaidError,
    qrisImageUrl,
    itemsError,
    paymentMethodError,
    canSubmit,
    processing,
    onClear,
    onQuantityChange,
}: {
    lines: CartLine[];
    total: number;
    clientName: string;
    clientNameError?: string;
    onClientNameChange: (value: string) => void;
    method: string;
    paymentMethods: PaymentMethodOption[];
    onMethodChange: (value: string) => void;
    amountPaid: string;
    onAmountPaidChange: (value: string) => void;
    amountPaidError?: string;
    qrisImageUrl: string;
    itemsError?: string;
    paymentMethodError?: string;
    canSubmit: boolean;
    processing: boolean;
    onClear: () => void;
    onQuantityChange: (productId: number, quantity: number) => void;
}) {
    const isCash = method === 'cash';
    const paid = Number(amountPaid);
    const change = paid - total;

    return (
        <section
            aria-label="Pesanan saat ini"
            className="flex flex-col border border-border bg-card lg:sticky lg:top-4 lg:h-[calc(100svh-4.5rem)]"
        >
            <header className="flex items-baseline gap-3 border-b border-border px-4 py-3">
                <h2 className="font-data text-[11px] tracking-[0.24em] uppercase">
                    Buku Bon
                </h2>
                <span
                    aria-hidden="true"
                    className="min-w-4 flex-1 translate-y-[-3px] border-b border-dotted border-border"
                />
                <span className="font-data text-[11px] text-muted-foreground tabular-nums">
                    {lines.length} item
                </span>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto">
                {lines.length === 0 ? (
                    <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                        Ketuk menu untuk menambah pesanan.
                    </p>
                ) : (
                    <ul className="divide-y divide-border">
                        {lines.map((line) => (
                            <li
                                key={line.product.id}
                                className="flex items-start gap-2 px-4 py-2.5"
                            >
                                <input
                                    type="hidden"
                                    name={`items[${line.product.id}][product_id]`}
                                    value={line.product.id}
                                />

                                <div className="min-w-0 flex-1">
                                    <p className="text-sm leading-snug font-medium">
                                        {line.product.name}
                                    </p>

                                    <div className="mt-1.5 flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                onQuantityChange(
                                                    line.product.id,
                                                    line.quantity - 1,
                                                )
                                            }
                                            aria-label={`Kurangi ${line.product.name}`}
                                            className="flex size-6 items-center justify-center border border-border text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
                                        >
                                            <Minus className="size-3" />
                                        </button>

                                        <input
                                            type="number"
                                            name={`items[${line.product.id}][quantity]`}
                                            min="1"
                                            value={line.quantity}
                                            onChange={(event) =>
                                                onQuantityChange(
                                                    line.product.id,
                                                    Number(event.target.value),
                                                )
                                            }
                                            className="h-6 w-10 border border-border bg-transparent px-1 text-center font-data text-[13px] tabular-nums outline-none focus-visible:border-primary"
                                        />

                                        <button
                                            type="button"
                                            onClick={() =>
                                                onQuantityChange(
                                                    line.product.id,
                                                    line.quantity + 1,
                                                )
                                            }
                                            aria-label={`Tambah ${line.product.name}`}
                                            className="flex size-6 items-center justify-center border border-border text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
                                        >
                                            <Plus className="size-3" />
                                        </button>
                                    </div>
                                </div>

                                <span className="shrink-0 font-data text-sm tabular-nums">
                                    {formatAmount(
                                        Number(line.product.price) *
                                            line.quantity,
                                    )}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="border-t border-border">
                <div aria-hidden="true" className="bon-rule" />

                <div className="flex items-baseline justify-between gap-3 px-4 pt-3">
                    <span className="font-data text-[11px] tracking-[0.2em] uppercase">
                        Total
                    </span>
                    <span className="font-data text-2xl leading-none font-bold tabular-nums">
                        Rp {formatAmount(total)}
                    </span>
                </div>

                <div className="space-y-4 px-4 pt-4 pb-4">
                    <div className="space-y-1.5">
                        <label
                            htmlFor="client_name"
                            className="font-data text-[11px] tracking-[0.2em] text-muted-foreground uppercase"
                        >
                            Nama pelanggan
                        </label>

                        <Input
                            id="client_name"
                            name="client_name"
                            value={clientName}
                            onChange={(event) =>
                                onClientNameChange(event.target.value)
                            }
                            placeholder="Wajib diisi"
                            autoComplete="off"
                            className="h-10 rounded-none"
                        />

                        {clientNameError && (
                            <p className="text-xs text-destructive">
                                {clientNameError}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <span className="block font-data text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
                            Pembayaran
                        </span>

                        <div className="grid grid-cols-2 gap-2">
                            {paymentMethods.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => onMethodChange(option.value)}
                                    aria-pressed={method === option.value}
                                    className={cn(
                                        'h-9 rounded-none border font-data text-[11px] tracking-[0.16em] uppercase transition-colors',
                                        method === option.value
                                            ? 'border-primary bg-primary text-primary-foreground'
                                            : 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground',
                                    )}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>

                        <input
                            type="hidden"
                            name="payment_method"
                            value={method}
                        />

                        {isCash && (
                            <div className="space-y-2 border border-border p-2.5">
                                <div className="flex flex-wrap gap-1.5">
                                    {total > 0 &&
                                        cashPresets(total).map((preset) => (
                                            <button
                                                key={preset}
                                                type="button"
                                                onClick={() =>
                                                    onAmountPaidChange(
                                                        String(preset),
                                                    )
                                                }
                                                className="border border-border px-2 py-1 font-data text-[12px] tabular-nums transition-colors hover:border-foreground/40 hover:bg-muted"
                                            >
                                                {preset === total
                                                    ? 'Uang pas'
                                                    : formatAmount(preset)}
                                            </button>
                                        ))}
                                </div>

                                <Input
                                    id="amount_paid"
                                    name="amount_paid"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={amountPaid}
                                    onChange={(event) =>
                                        onAmountPaidChange(event.target.value)
                                    }
                                    placeholder="Uang diterima"
                                    className="h-10 rounded-none font-data tabular-nums"
                                />

                                {amountPaid !== '' && (
                                    <p
                                        className={cn(
                                            'font-data text-[13px] tabular-nums',
                                            change < 0
                                                ? 'text-destructive'
                                                : 'text-foreground',
                                        )}
                                    >
                                        {change < 0
                                            ? `Kurang ${formatAmount(Math.abs(change))}`
                                            : change === 0
                                              ? 'Uang pas'
                                              : `Kembali ${formatAmount(change)}`}
                                    </p>
                                )}

                                {amountPaidError && (
                                    <p className="text-xs text-destructive">
                                        {amountPaidError}
                                    </p>
                                )}
                            </div>
                        )}

                        {method === 'qris' && (
                            <div className="space-y-2 border border-border p-2.5 text-center">
                                <img
                                    src={qrisImageUrl}
                                    alt="QRIS pembayaran"
                                    className="mx-auto size-40 rounded-none border border-border object-contain"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Minta pelanggan scan QRIS sebesar Rp{' '}
                                    {formatAmount(total)}
                                </p>
                            </div>
                        )}

                        {paymentMethodError && (
                            <p className="text-xs text-destructive">
                                {paymentMethodError}
                            </p>
                        )}
                    </div>

                    {itemsError && (
                        <p className="text-xs text-destructive">{itemsError}</p>
                    )}

                    <Button
                        type="submit"
                        className="h-12 w-full rounded-none tracking-[0.16em] uppercase"
                        disabled={processing || !canSubmit}
                    >
                        Selesaikan &amp; Bayar
                    </Button>

                    <Button
                        type="button"
                        variant="outline"
                        className="h-9 w-full rounded-none"
                        onClick={onClear}
                        disabled={processing || lines.length === 0}
                    >
                        <X className="mr-2 h-4 w-4" />
                        Kosongkan
                    </Button>
                </div>
            </div>
        </section>
    );
}
