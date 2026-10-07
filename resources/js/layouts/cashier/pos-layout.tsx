import { Link, usePage } from '@inertiajs/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';
import { dashboard as cashierDashboard } from '@/routes/cashier';
import { index as orders } from '@/routes/cashier/orders';
import type { Auth } from '@/types';

/**
 * The point of sale shell.
 *
 * The cashier works standing, looking at a customer, not navigating: the menu
 * and the running order fill the whole width and no sidebar is spent on links
 * that a cashier never visits mid-transaction.
 */
export default function PosLayout({ children }: { children: React.ReactNode }) {
    const { auth, name } = usePage().props as { auth: Auth; name: string };
    const user = auth.user;
    const getInitials = useInitials();

    return (
        <div className="bon-world flex min-h-svh flex-col font-slip">
            <header className="flex flex-wrap items-center gap-x-4 gap-y-2 bg-foreground px-4 py-2.5 text-background md:px-6">
                <Link
                    href={cashierDashboard()}
                    className="text-[13px] font-semibold tracking-[0.2em] uppercase"
                >
                    {name}
                </Link>

                <span className="font-data text-[11px] tracking-[0.24em] text-background/70">
                    Kasir
                </span>

                <span
                    aria-hidden="true"
                    className="hidden h-0 min-w-6 flex-1 border-b border-dotted border-background/40 md:block"
                />

                <nav className="flex items-center gap-1">
                    <PosNavLink href={orders().url}>Transaksi</PosNavLink>
                </nav>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            type="button"
                            className="rounded-none outline-none focus-visible:ring-2 focus-visible:ring-background"
                        >
                            <Avatar className="size-7 rounded-none">
                                <AvatarImage
                                    src={user.avatar}
                                    alt={user.name}
                                />
                                <AvatarFallback className="rounded-none bg-background/15 text-[11px] text-background">
                                    {getInitials(user.name)}
                                </AvatarFallback>
                            </Avatar>
                            <span className="sr-only">Menu akun</span>
                        </button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end">
                        <UserMenuContent user={user} />
                    </DropdownMenuContent>
                </DropdownMenu>
            </header>

            <main className="flex-1 px-4 py-5 md:px-6 md:py-6">{children}</main>
        </div>
    );
}

function PosNavLink({
    href,
    children,
}: {
    href: string;
    children: React.ReactNode;
}) {
    return (
        <Button
            variant="ghost"
            size="sm"
            asChild
            className="font-data text-[11px] tracking-[0.2em] text-background/80 uppercase hover:bg-background/10 hover:text-background"
        >
            <Link href={href}>{children}</Link>
        </Button>
    );
}
