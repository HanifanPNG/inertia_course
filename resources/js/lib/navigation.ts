import {
    BarChart3,
    LayoutDashboard,
    Monitor,
    Package,
    Receipt,
    Tags,
} from 'lucide-react';
import { dashboard as adminDashboard } from '@/routes/admin';
import { index as reports } from '@/routes/admin/reports';
import { index as categories } from '@/routes/admin/categories';
import { index as products } from '@/routes/admin/products';
import { dashboard as cashierDashboard } from '@/routes/cashier';
import { index as orders } from '@/routes/cashier/orders';
import { display as orderDisplay } from '@/routes/orders';
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
            {
                title: 'Laporan',
                href: reports(),
                icon: BarChart3,
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

    items.push({
        title: 'Display',
        href: orderDisplay(),
        icon: Monitor,
    });

    return items;
}
