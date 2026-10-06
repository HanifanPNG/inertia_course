import { Form, Head, Link } from '@inertiajs/react';
import CategoryFormFields from '@/components/category-form-fields';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import CategoryController from '@/actions/App/Http/Controllers/Admin/CategoryController';
import { index } from '@/routes/admin/categories';

export type CategoryData = {
    id: number;
    name: string;
    description: string | null;
};

export default function CategoryEdit({ category }: { category: CategoryData }) {
    return (
        <>
            <Head title={`Ubah ${category.name}`} />

            <h1 className="sr-only">Ubah Kategori</h1>

            <div className="space-y-6">
                <Heading
                    title="Ubah Kategori"
                    description={`Perbarui data kategori ${category.name}`}
                />

                <Form
                    {...CategoryController.update.form({
                        category: category.id,
                    })}
                    options={{ preserveScroll: true }}
                    className="max-w-xl space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <CategoryFormFields
                                values={{
                                    name: category.name,
                                    description: category.description ?? '',
                                }}
                                errors={errors}
                                idPrefix="edit"
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

CategoryEdit.layout = {
    breadcrumbs: [
        { title: 'Kategori', href: index() },
        { title: 'Ubah', href: index() },
    ],
};
