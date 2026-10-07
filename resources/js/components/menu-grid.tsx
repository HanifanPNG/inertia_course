import { ImageOff, Minus, Plus } from 'lucide-react';
import { formatAmount } from '@/lib/format';

export type MenuProduct = {
    id: number;
    name: string;
    price: string;
    image_url: string | null;
};

export type MenuCategory = {
    id: number;
    name: string;
    products: MenuProduct[];
};

/**
 * Lanes a cashier reaches for first: food, then drinks, then the rest.
 *
 * The order comes from the names because a restaurant owner curates categories
 * by hand in the admin; new categories simply fall in behind the rest.
 */
const PRIMARY_LANES = ['makanan', 'minuman'];

export const orderedCategories = (categories: MenuCategory[]): MenuCategory[] =>
    [...categories].sort((left, right) => {
        const rank = (category: MenuCategory) => {
            const index = PRIMARY_LANES.indexOf(
                category.name.trim().toLowerCase(),
            );

            return index === -1 ? PRIMARY_LANES.length : index;
        };

        const difference = rank(left) - rank(right);

        return difference !== 0
            ? difference
            : left.name.localeCompare(right.name, 'id');
    });

export default function MenuGrid({
    menu,
    activeCategoryId,
    onCategoryChange,
    quantityFor,
    onAdd,
    onRemove,
}: {
    menu: MenuCategory[];
    activeCategoryId: number | null;
    onCategoryChange: (categoryId: number) => void;
    quantityFor: (productId: number) => number;
    onAdd: (product: MenuProduct) => void;
    onRemove: (productId: number) => void;
}) {
    if (menu.length === 0) {
        return (
            <p className="border border-border bg-card px-4 py-6 text-sm text-muted-foreground">
                Belum ada produk aktif. Tambahkan produk terlebih dahulu.
            </p>
        );
    }

    const categories = orderedCategories(menu);
    const activeCategory =
        categories.find((category) => category.id === activeCategoryId) ??
        categories[0];

    return (
        <div className="space-y-4">
            <nav
                aria-label="Kategori menu"
                className="flex gap-2 overflow-x-auto pb-1"
            >
                {categories.map((category) => {
                    const isActive = category.id === activeCategory.id;

                    return (
                        <button
                            key={category.id}
                            type="button"
                            onClick={() => onCategoryChange(category.id)}
                            aria-current={isActive ? 'true' : undefined}
                            className={
                                'shrink-0 border px-3 py-2 font-data text-[11px] tracking-[0.2em] whitespace-nowrap uppercase transition-colors ' +
                                (isActive
                                    ? 'border-foreground bg-foreground text-background'
                                    : 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground')
                            }
                        >
                            {category.name}
                        </button>
                    );
                })}
            </nav>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                {activeCategory.products.map((product) => {
                    const quantity = quantityFor(product.id);

                    return (
                        <div
                            key={product.id}
                            className="flex flex-col overflow-hidden rounded-none border border-border bg-card transition-colors hover:border-foreground/40 hover:bg-muted/40"
                        >
                            <button
                                type="button"
                                onClick={() => onAdd(product)}
                                className="flex flex-1 flex-col text-left"
                            >
                                {product.image_url ? (
                                    <img
                                        src={product.image_url}
                                        alt={product.name}
                                        className="aspect-video w-full rounded-none object-cover"
                                    />
                                ) : (
                                    <span className="flex aspect-video w-full items-center justify-center border-b border-dashed border-border/70 bg-muted text-muted-foreground/60">
                                        <ImageOff className="size-5" />
                                    </span>
                                )}

                                <span className="flex flex-1 flex-col gap-2 p-3">
                                    <span className="flex-1 text-sm leading-snug font-medium">
                                        {product.name}
                                    </span>

                                    <span className="font-data text-[13px] tabular-nums">
                                        Rp {formatAmount(product.price)}
                                    </span>
                                </span>
                            </button>

                            <div className="flex items-center gap-1 px-3 pb-3">
                                <button
                                    type="button"
                                    onClick={() => onRemove(product.id)}
                                    disabled={quantity === 0}
                                    aria-label={`Kurangi ${product.name}`}
                                    className="flex h-8 w-8 items-center justify-center border border-border text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground disabled:opacity-40"
                                >
                                    <Minus className="size-3.5" />
                                </button>

                                <span className="h-8 min-w-10 flex-1 border border-border text-center font-data text-[13px] leading-8 tabular-nums">
                                    {quantity}
                                </span>

                                <button
                                    type="button"
                                    onClick={() => onAdd(product)}
                                    aria-label={`Tambah ${product.name}`}
                                    className="flex h-8 w-8 items-center justify-center border border-border text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
                                >
                                    <Plus className="size-3.5" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
