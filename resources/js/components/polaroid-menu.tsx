import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Minus, Plus } from 'lucide-react';
import { formatAmount } from '@/lib/format';
import { cn } from '@/lib/utils';

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

/** Prints hang four to a row; anything more spills onto the next string. */
const COLUMNS = 4;
const GAP = 20;
const STRING_Y = 10;
const SAG = 20;
/** The string's drawing surface: 1 SVG unit must equal 1px, or the pegs drift. */
const STRING_HEIGHT = 52;
/**
 * Gap between the string and the top of the print, so the wire stays visible
 * between the prints instead of hiding behind them.
 */
const KUSEN = 12;

/** Height of the sagging string at `x`, given a row of width `width`. */
function stringY(x: number, width: number): number {
    if (width <= 0) {
        return STRING_Y;
    }

    const t = Math.min(1, Math.max(0, x / width));

    return STRING_Y + 4 * SAG * t * (1 - t);
}

export default function PolaroidMenu({
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

    const rows = chunk(activeCategory.products, COLUMNS);

    return (
        <div className="space-y-5">
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

            {rows.map((row, rowIndex) => (
                <PolaroidRow
                    key={rowIndex}
                    products={row}
                    quantityFor={quantityFor}
                    onAdd={onAdd}
                    onRemove={onRemove}
                />
            ))}
        </div>
    );
}

function PolaroidRow({
    products,
    quantityFor,
    onAdd,
    onRemove,
}: {
    products: MenuProduct[];
    quantityFor: (productId: number) => number;
    onAdd: (product: MenuProduct) => void;
    onRemove: (productId: number) => void;
}) {
    const row = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(0);

    useEffect(() => {
        const element = row.current;

        if (!element) {
            return;
        }

        const observer = new ResizeObserver(() =>
            setWidth(element.clientWidth),
        );

        observer.observe(element);
        setWidth(element.clientWidth);

        return () => observer.disconnect();
    }, []);

    const cellWidth = width ? (width - GAP * (COLUMNS - 1)) / COLUMNS : 0;
    const centreOf = (index: number) =>
        index * (cellWidth + GAP) + cellWidth / 2;

    return (
        <div className="relative">
            {width > 0 && (
                <svg
                    aria-hidden="true"
                    style={{ height: STRING_HEIGHT }}
                    viewBox={`0 0 ${width} ${STRING_HEIGHT}`}
                    preserveAspectRatio="none"
                    className="pointer-events-none absolute inset-x-0 top-0 w-full"
                >
                    <path
                        d={`M0 ${stringY(0, width)} Q${
                            width / 2
                        } ${STRING_Y + 2 * SAG} ${width} ${stringY(
                            width,
                            width,
                        )}`}
                        fill="none"
                        stroke="rgb(28 26 23 / 0.24)"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                    />
                </svg>
            )}

            <div
                ref={row}
                className="grid gap-x-5 gap-y-8"
                style={{
                    gridTemplateColumns: `repeat(${COLUMNS}, minmax(0, 1fr))`,
                }}
            >
                {products.map((product, index) => (
                    <PolaroidPrint
                        key={product.id}
                        product={product}
                        index={index}
                        // the print hangs a kusen below the string; the peg
                        // bridges that gap and lands on the wire
                        drop={
                            width ? stringY(centreOf(index), width) + KUSEN : 42
                        }
                        quantity={quantityFor(product.id)}
                        onAdd={onAdd}
                        onRemove={onRemove}
                    />
                ))}
            </div>
        </div>
    );
}

/**
 * One print on the string.
 *
 * The wobble is started by a pointer landing on the card and is deliberately
 * left to finish when the pointer leaves: cancelling it half way would snap the
 * card back to its resting angle mid-swing, which the eye reads as a blink.
 */
function PolaroidPrint({
    product,
    index,
    drop,
    quantity,
    onAdd,
    onRemove,
}: {
    product: MenuProduct;
    index: number;
    /** How far the card hangs below the string at its own peg. */
    drop: number;
    quantity: number;
    onAdd: (product: MenuProduct) => void;
    onRemove: (productId: number) => void;
}) {
    const [wobbling, setWobbling] = useState(false);
    const inside = useRef(false);
    const swinging = useRef(false);

    /*
     * One swing per visit. The card keeps moving while the pointer rests on it,
     * which nudges the pointer across its edge; without the guards that would
     * restart the swing and read as a blink. The class is only dropped when the
     * pointer has gone AND the swing has finished, so the card never snaps.
     */
    const startWobble = () => {
        inside.current = true;

        if (swinging.current) {
            return;
        }

        swinging.current = true;
        setWobbling(true);
    };

    const leaveCard = () => {
        inside.current = false;

        if (!swinging.current) {
            setWobbling(false);
        }
    };

    return (
        <div className="flex justify-center" style={{ marginTop: drop }}>
            <div
                className={cn(
                    'bon-print w-full max-w-[15rem]',
                    wobbling && 'is-wobbling',
                )}
                style={
                    {
                        '--bon-tilt': `${-1.1 + (index % 3) * 1.1}deg`,
                        '--bon-delay': `${index * 70}ms`,
                    } as CSSProperties
                }
                onPointerEnter={startWobble}
                onPointerLeave={leaveCard}
                onFocus={startWobble}
                onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget)) {
                        leaveCard();
                    }
                }}
                onAnimationEnd={(event) => {
                    if (!event.animationName.includes('wobble')) {
                        return;
                    }

                    swinging.current = false;

                    if (!inside.current) {
                        setWobbling(false);
                    }
                }}
            >
                <span
                    aria-hidden="true"
                    className="absolute bottom-full left-1/2 z-20 flex -translate-x-1/2 flex-col items-center"
                >
                    <span className="size-2 bg-primary shadow-[0_1px_2px_rgba(0,0,0,0.35)]" />
                    <span className="h-2 w-[3px] bg-foreground/70" />
                </span>

                <div className="bon-print-frame border border-border bg-card p-1.5 pb-1 shadow-[0_1px_2px_rgba(28,26,23,0.14),0_12px_20px_-14px_rgba(28,26,23,0.4)]">
                    <button
                        type="button"
                        onClick={() => onAdd(product)}
                        className="block w-full"
                    >
                        {product.image_url ? (
                            <img
                                src={product.image_url}
                                alt=""
                                className="aspect-[4/3] w-full object-cover"
                            />
                        ) : (
                            <span className="block aspect-[4/3] w-full bg-muted/70" />
                        )}
                    </button>

                    <div className="px-1 pt-2 pb-1.5">
                        <p className="text-center text-[13px] leading-tight font-medium">
                            {product.name}
                        </p>

                        <p className="mt-1 text-center font-data text-[12px] text-muted-foreground tabular-nums">
                            Rp {formatAmount(product.price)}
                        </p>

                        <div className="mt-2 flex items-center justify-center gap-1.5">
                            <button
                                type="button"
                                onClick={() => onRemove(product.id)}
                                disabled={quantity === 0}
                                aria-label={`Kurangi ${product.name}`}
                                className="flex size-7 items-center justify-center border border-border text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground disabled:opacity-40"
                            >
                                <Minus className="size-3.5" />
                            </button>

                            <span
                                aria-label={`Jumlah ${product.name}`}
                                className="h-7 min-w-9 border border-border text-center font-data text-[13px] leading-[26px] tabular-nums"
                            >
                                {quantity}
                            </span>

                            <button
                                type="button"
                                onClick={() => onAdd(product)}
                                aria-label={`Tambah ${product.name}`}
                                className="flex size-7 items-center justify-center border border-border text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
                            >
                                <Plus className="size-3.5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function chunk<T>(items: T[], size: number): T[][] {
    const rows: T[][] = [];

    for (let index = 0; index < items.length; index += size) {
        rows.push(items.slice(index, index + size));
    }

    return rows;
}
