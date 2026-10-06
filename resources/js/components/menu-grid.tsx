import { ImageOff, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/format';

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

export default function MenuGrid({
    menu,
    quantityFor,
    onAdd,
    onRemove,
}: {
    menu: MenuCategory[];
    quantityFor: (productId: number) => number;
    onAdd: (product: MenuProduct) => void;
    onRemove: (productId: number) => void;
}) {
    if (menu.length === 0) {
        return (
            <p className="text-sm text-muted-foreground">
                Belum ada produk aktif. Tambahkan produk terlebih dahulu.
            </p>
        );
    }

    return (
        <div className="space-y-4">
            {menu.map((category) => (
                <div key={category.id} className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase">
                        {category.name}
                    </p>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                        {category.products.map((product) => {
                            const quantity = quantityFor(product.id);

                            return (
                                <div
                                    key={product.id}
                                    className="flex flex-col overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border"
                                >
                                    {product.image_url ? (
                                        <img
                                            src={product.image_url}
                                            alt={product.name}
                                            className="aspect-video w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex aspect-video w-full items-center justify-center bg-muted text-muted-foreground">
                                            <ImageOff className="size-6" />
                                        </div>
                                    )}

                                    <div className="flex flex-1 flex-col gap-2 p-3">
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">
                                                {product.name}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {formatCurrency(product.price)}
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between gap-1">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                onClick={() =>
                                                    onRemove(product.id)
                                                }
                                                aria-label={`Kurangi ${product.name}`}
                                            >
                                                <Minus />
                                            </Button>

                                            <span className="text-sm font-medium">
                                                {quantity}
                                            </span>

                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="icon"
                                                onClick={() => onAdd(product)}
                                                aria-label={`Tambah ${product.name}`}
                                            >
                                                <Plus />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}
