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
import { formatAmount } from '@/lib/format';
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
    const hasImages = products.some((product) => product.image_url !== null);

    return (
        <>
            <Head title="Produk" />

            <h1 className="sr-only">Produk</h1>

            <div>
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <Heading
                        title="Produk"
                        description="Kelola menu yang tersedia di kasir"
                    />

                    <Button asChild>
                        <Link href={create()}>Tambah Produk</Link>
                    </Button>
                </div>

                <div aria-hidden="true" className="bon-rule mt-4 sm:mt-1" />

                {products.length === 0 ? (
                    <div className="mt-6 border border-border px-4 py-6 text-sm text-muted-foreground">
                        Belum ada produk.{' '}
                        <Link
                            href={create()}
                            className="text-foreground underline underline-offset-4"
                        >
                            Tambahkan produk pertama
                        </Link>
                        .
                    </div>
                ) : (
                    <div className="mt-6 overflow-x-auto border border-border">
                        <table className="w-full min-w-[46rem] text-left text-sm">
                            <thead className="border-b border-foreground/25">
                                <tr className="font-data text-[10.5px] tracking-[0.2em] text-muted-foreground uppercase">
                                    {hasImages && (
                                        <th className="px-4 py-2.5 font-medium">
                                            Gambar
                                        </th>
                                    )}
                                    <th className="px-4 py-2.5 font-medium">
                                        Nama
                                    </th>
                                    <th className="px-4 py-2.5 font-medium">
                                        Kategori
                                    </th>
                                    <th className="px-4 py-2.5 text-right font-medium">
                                        Harga (Rp)
                                    </th>
                                    <th className="px-4 py-2.5 font-medium">
                                        Status
                                    </th>
                                    <th className="px-4 py-2.5 text-right font-medium">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((product) => (
                                    <tr
                                        key={product.id}
                                        className="border-b border-border last:border-b-0"
                                    >
                                        {hasImages && (
                                            <td className="px-4 py-3">
                                                {product.image_url ? (
                                                    <img
                                                        src={product.image_url}
                                                        alt={product.name}
                                                        className="size-10 rounded-none border border-border object-cover"
                                                    />
                                                ) : (
                                                    <div className="size-10 rounded-none border border-dashed border-border" />
                                                )}
                                            </td>
                                        )}
                                        <td className="px-4 py-3 font-medium">
                                            {product.name}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {product.category.name}
                                        </td>
                                        <td className="px-4 py-3 text-right font-data text-[13px] tabular-nums">
                                            {formatAmount(product.price)}
                                        </td>
                                        <td className="px-4 py-3">
                                            {product.is_active ? (
                                                <Badge
                                                    variant="outline"
                                                    className="border-border"
                                                >
                                                    <span
                                                        aria-hidden="true"
                                                        className="mr-1.5 size-1.5 bg-primary"
                                                    />
                                                    Aktif
                                                </Badge>
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
                <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10"
                >
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
