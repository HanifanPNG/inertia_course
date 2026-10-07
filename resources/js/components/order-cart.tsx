import { useState, type ReactNode } from 'react';
import { Form, Link } from '@inertiajs/react';
import { ShoppingCart } from 'lucide-react';
import MenuGrid, {
    orderedCategories,
    type MenuCategory,
    type MenuProduct,
} from '@/components/menu-grid';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/format';
import type { RouteFormDefinition } from '@/wayfinder';

export type { MenuCategory, MenuProduct };

export type OrderLine = {
    product: MenuProduct;
    quantity: number;
};

export default function OrderCart({
    action,
    menu,
    initialLines = [],
    cancelHref,
    children,
}: {
    action: RouteFormDefinition<'post' | 'put'>;
    menu: MenuCategory[];
    initialLines?: OrderLine[];
    cancelHref: string;
    children: (state: { processing: boolean }) => ReactNode;
}) {
    const [lines, setLines] = useState<OrderLine[]>(initialLines);
    const [categoryId, setCategoryId] = useState<number | null>(
        () => orderedCategories(menu)[0]?.id ?? null,
    );

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

    const removeProduct = (productId: number) =>
        changeQuantity(productId, quantityFor(productId) - 1);

    const total = lines.reduce(
        (sum, line) => sum + Number(line.product.price) * line.quantity,
        0,
    );

    const quantityFor = (productId: number) =>
        lines.find((line) => line.product.id === productId)?.quantity ?? 0;

    return (
        <Form
            {...action}
            options={{ preserveScroll: true }}
            className="grid gap-6 lg:grid-cols-[2fr_1fr]"
        >
            {({ processing }) => (
                <>
                    <MenuGrid
                        menu={menu}
                        activeCategoryId={categoryId}
                        onCategoryChange={setCategoryId}
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
                                                            event.target.value,
                                                        ),
                                                    )
                                                }
                                                className="mx-1 w-14 rounded-md border border-input bg-transparent px-2 py-1 text-center text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                            />
                                        </span>

                                        <span className="font-medium">
                                            {formatCurrency(
                                                Number(line.product.price) *
                                                    line.quantity,
                                            )}
                                        </span>
                                    </div>
                                ))}

                                <div className="flex items-center justify-between border-t border-sidebar-border/70 pt-3 text-sm font-medium dark:border-sidebar-border">
                                    <span>Total</span>
                                    <span>{formatCurrency(total)}</span>
                                </div>

                                {children({ processing })}

                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full"
                                    asChild
                                >
                                    <Link href={cancelHref}>Batal</Link>
                                </Button>
                            </>
                        )}
                    </div>
                </>
            )}
        </Form>
    );
}
