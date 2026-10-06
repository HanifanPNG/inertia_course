import { Form, Head, Link } from '@inertiajs/react';
import CategoryFormFields from '@/components/category-form-fields';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import CategoryController from '@/actions/App/Http/Controllers/Admin/CategoryController';
import { create, index } from '@/routes/admin/categories';

export default function CategoryCreate() {
    return (
        <>
            <Head title="Tambah Kategori" />

            <h1 className="sr-only">Tambah Kategori</h1>

            <div className="space-y-6">
                <Heading
                    title="Tambah Kategori"
                    description="Buat kategori baru untuk mengelompokkan menu"
                />

                <Form
                    {...CategoryController.store.form()}
                    options={{ preserveScroll: true }}
                    className="max-w-xl space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <CategoryFormFields
                                values={{ name: '', description: '' }}
                                errors={errors}
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
            </div>
        </>
    );
}

CategoryCreate.layout = {
    breadcrumbs: [
        { title: 'Kategori', href: index() },
        { title: 'Tambah', href: create() },
    ],
};
