import { Head } from '@inertiajs/react';
import Heading from '@/components/heading';
import { dashboard } from '@/routes/admin';

export default function AdminDashboard() {
    return (
        <>
            <Head title="Admin Dashboard" />

            <h1 className="sr-only">Admin Dashboard</h1>

            <Heading
                title="Admin Dashboard"
                description="Kelola master data menu dan lihat laporan penjualan restoran"
            />

            <p className="text-sm text-muted-foreground">
                Modul kategori dan menu akan tersedia pada tahap selanjutnya.
            </p>
        </>
    );
}

AdminDashboard.layout = {
    breadcrumbs: [
        {
            title: 'Admin Dashboard',
            href: dashboard(),
        },
    ],
};
