import { Form, Head, Link } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import ProductController from '@/actions/App/Http/Controllers/Admin/ProductController';
import { create as createCategory } from '@/routes/admin/categories';
import { index } from '@/routes/admin/products';
import ProductFormFields, {
    type CategoryOption,
} from '@/components/product-form-fields';

export default function ProductCreate({
    categories,
}: {
    categories: CategoryOption[];
}) {
    return (
        <>
            <Head title="Tambah Produk" />

            <h1 className="sr-only">Tambah Produk</h1>

            <div className="space-y-6">
                <Heading
                    title="Tambah Produk"
                    description="Tambahkan menu baru ke daftar produk restoran"
                />

                {categories.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        Buat kategori terlebih dahulu sebelum menambahkan
                        produk.{' '}
                        <Link
                            href={createCategory()}
                            className="underline underline-offset-4"
                        >
                            Tambah kategori
                        </Link>
                        .
                    </p>
                ) : (
                    <Form
                        {...ProductController.store.form()}
                        options={{ preserveScroll: true }}
                        className="max-w-xl space-y-6"
                    >
                        {({ processing, errors }) => (
                            <>
                                <ProductFormFields
                                    values={{
                                        category_id: '',
                                        name: '',
                                        description: '',
                                        price: '',
                                        is_active: true,
                                    }}
                                    errors={errors}
                                    categories={categories}
                                    idPrefix="create"
                                />

                                <div className="flex items-center gap-4">
                                    <Button type="submit" disabled={processing}>
                                        Simpan
                                    </Button>

                                    <Button variant="outline" asChild>
                                        <Link href={index()}>Batal</Link>
                                    </Button>
                                </div>
                            </>
                        )}
                    </Form>
                )}
            </div>
        </>
    );
}

ProductCreate.layout = {
    breadcrumbs: [
        { title: 'Produk', href: index() },
        { title: 'Tambah', href: index() },
    ],
};
