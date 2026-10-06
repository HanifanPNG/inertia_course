import { Form, Head, Link } from '@inertiajs/react';
import ProductController from '@/actions/App/Http/Controllers/Admin/ProductController';
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
import { create, edit, index } from '@/routes/admin/products';

export type ProductData = {
    id: number;
    name: string;
    description: string | null;
    price: string;
    is_active: boolean;
    image_url: string | null;
    category: {
        id: number;
        name: string;
    };
};

export default function ProductsIndex({
    products,
}: {
    products: ProductData[];
}) {
    return (
        <>
            <Head title="Produk" />

            <h1 className="sr-only">Produk</h1>

            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <Heading
                        title="Produk"
                        description="Kelola menu yang tersedia di kasir"
                    />

                    <Button asChild>
                        <Link href={create()}>Tambah Produk</Link>
                    </Button>
                </div>

                {products.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        Belum ada produk.{' '}
                        <Link
                            href={create()}
                            className="underline underline-offset-4"
                        >
                            Tambahkan produk pertama
                        </Link>
                        .
                    </p>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-sidebar-border/70 text-xs text-muted-foreground dark:border-sidebar-border">
                                <tr>
                                    <th className="px-4 py-3 font-medium">
                                        Gambar
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Nama
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Kategori
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Harga
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-right font-medium">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                                {products.map((product) => (
                                    <tr key={product.id}>
                                        <td className="px-4 py-3">
                                            {product.image_url ? (
                                                <img
                                                    src={product.image_url}
                                                    alt={product.name}
                                                    className="h-12 w-12 rounded-lg border border-sidebar-border/70 object-cover dark:border-sidebar-border"
                                                />
                                            ) : (
                                                <div className="h-12 w-12 rounded-lg border border-dashed border-sidebar-border/70 dark:border-sidebar-border" />
                                            )}
                                        </td>
                                        <td className="px-4 py-3 font-medium">
                                            {product.name}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {product.category.name}
                                        </td>
                                        <td className="px-4 py-3">
                                            {formatCurrency(product.price)}
                                        </td>
                                        <td className="px-4 py-3">
                                            {product.is_active ? (
                                                <Badge>Aktif</Badge>
                                            ) : (
                                                <Badge variant="secondary">
                                                    Nonaktif
                                                </Badge>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    asChild
                                                >
                                                    <Link
                                                        href={edit({
                                                            product: product.id,
                                                        })}
                                                    >
                                                        Ubah
                                                    </Link>
                                                </Button>

                                                <ProductDeleteDialog
                                                    product={product}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}

function ProductDeleteDialog({ product }: { product: ProductData }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                    Hapus
                    <span className="sr-only"> {product.name}</span>
                </Button>
            </DialogTrigger>

            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        Hapus produk &ldquo;{product.name}&rdquo;?
                    </DialogTitle>
                    <DialogDescription>
                        Produk akan dihapus dari daftar menu. Transaksi yang
                        sudah tercatat tetap menyimpan nama dan harga produk
                        ini. Tindakan ini tidak dapat dibatalkan.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    {...ProductController.destroy.form({
                        product: product.id,
                    })}
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

ProductsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Produk',
            href: index(),
        },
    ],
};
