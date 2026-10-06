import { LayoutDashboard, Package, Receipt, Tags } from 'lucide-react';
import { dashboard as adminDashboard } from '@/routes/admin';
import { index as categories } from '@/routes/admin/categories';
import { index as products } from '@/routes/admin/products';
import { dashboard as cashierDashboard } from '@/routes/cashier';
import { index as orders } from '@/routes/cashier/orders';
import type { NavItem, UserRole } from '@/types';

export function getNavItems(role?: UserRole): NavItem[] {
    const items: NavItem[] = [
        {
            title: 'Dashboard',
            href: role === 'cashier' ? cashierDashboard() : adminDashboard(),
            icon: LayoutDashboard,
        },
    ];

    if (role === 'admin') {
        items.push(
            {
                title: 'Kategori',
                href: categories(),
                icon: Tags,
            },
            {
                title: 'Produk',
                href: products(),
                icon: Package,
            },
        );
    }

    if (role === 'cashier') {
        items.push({
            title: 'Transaksi',
            href: orders(),
            icon: Receipt,
        });
    }

    return items;
}
