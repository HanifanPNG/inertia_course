import { Form, Head, Link } from '@inertiajs/react';
import Heading from '@/components/heading';
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
import CategoryController from '@/actions/App/Http/Controllers/Admin/CategoryController';
import { create, edit, index } from '@/routes/admin/categories';

export type CategoryData = {
    id: number;
    name: string;
    description: string | null;
    products_count: number;
};

export default function CategoriesIndex({
    categories,
}: {
    categories: CategoryData[];
}) {
    return (
        <>
            <Head title="Kategori" />

            <h1 className="sr-only">Kategori</h1>

            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <Heading
                        title="Kategori"
                        description="Kelola kategori menu restoran"
                    />

                    <Button asChild>
                        <Link href={create()}>Tambah Kategori</Link>
                    </Button>
                </div>

                {categories.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        Belum ada kategori.{' '}
                        <Link
                            href={create()}
                            className="underline underline-offset-4"
                        >
                            Tambahkan kategori pertama
                        </Link>
                        .
                    </p>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-sidebar-border/70 text-xs text-muted-foreground dark:border-sidebar-border">
                                <tr>
                                    <th className="px-4 py-3 font-medium">
                                        Nama
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Deskripsi
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Produk
                                    </th>
                                    <th className="px-4 py-3 text-right font-medium">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sidebar-border/70 dark:divide-sidebar-border">
                                {categories.map((category) => (
                                    <tr key={category.id}>
                                        <td className="px-4 py-3 font-medium">
                                            {category.name}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {category.description ?? '—'}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {category.products_count}
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
                                                            category:
                                                                category.id,
                                                        })}
                                                    >
                                                        Ubah
                                                    </Link>
                                                </Button>

                                                <CategoryDeleteDialog
                                                    category={category}
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

function CategoryDeleteDialog({ category }: { category: CategoryData }) {
    const hasProducts = category.products_count > 0;

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    variant="destructive"
                    size="sm"
                    disabled={hasProducts}
                    title={
                        hasProducts
                            ? 'Kategori tidak dapat dihapus karena masih memiliki produk.'
                            : undefined
                    }
                >
                    Hapus
                    <span className="sr-only"> {category.name}</span>
                </Button>
            </DialogTrigger>

            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        Hapus kategori &ldquo;{category.name}&rdquo;?
                    </DialogTitle>
                    <DialogDescription>
                        Tindakan ini tidak dapat dibatalkan.
                    </DialogDescription>
                </DialogHeader>

                <Form
                    {...CategoryController.destroy.form({
                        category: category.id,
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

CategoriesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Kategori',
            href: index(),
        },
    ],
};
