import { Form, Head, Link } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import ProductController from '@/actions/App/Http/Controllers/Admin/ProductController';
import { index } from '@/routes/admin/products';
import ProductFormFields, {
    type CategoryOption,
} from '@/components/product-form-fields';

export type ProductData = {
    id: number;
    category_id: number;
    name: string;
    description: string | null;
    price: string;
    is_active: boolean;
    image_url: string | null;
};

export default function ProductEdit({
    product,
    categories,
}: {
    product: ProductData;
    categories: CategoryOption[];
}) {
    return (
        <>
            <Head title={`Ubah ${product.name}`} />

            <h1 className="sr-only">Ubah Produk</h1>

            <div className="space-y-6">
                <Heading
                    title="Ubah Produk"
                    description={`Perbarui data produk ${product.name}`}
                />

                <Form
                    {...ProductController.update.form({ product: product.id })}
                    options={{ preserveScroll: true }}
                    className="max-w-xl space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <ProductFormFields
                                values={{
                                    category_id: String(product.category_id),
                                    name: product.name,
                                    description: product.description ?? '',
                                    price: product.price,
                                    is_active: product.is_active,
                                }}
                                errors={errors}
                                categories={categories}
                                idPrefix="edit"
                                currentImageUrl={product.image_url}
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
            </div>
        </>
    );
}

ProductEdit.layout = {
    breadcrumbs: [
        { title: 'Produk', href: index() },
        { title: 'Ubah', href: index() },
    ],
};
