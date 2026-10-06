import { Link, usePage } from '@inertiajs/react';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

function stampDate(): {
    iso: string;
    serial: string;
    label: string;
    weekday: string;
} {
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');

    const iso = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

    return {
        iso,
        serial: iso.slice(2).replaceAll('-', ''),
        label: new Intl.DateTimeFormat('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        })
            .format(now)
            .toUpperCase(),
        weekday: new Intl.DateTimeFormat('id-ID', { weekday: 'long' })
            .format(now)
            .toUpperCase(),
    };
}

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const { name } = usePage().props;
    const { iso, serial, label, weekday } = stampDate();

    return (
        <div className="bon-world relative flex min-h-svh flex-col font-slip antialiased">
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-0 hidden w-14 border-r border-border md:block"
            >
                <span className="absolute inset-y-0 left-4 w-px bg-[#c9bfa9]" />
                <span className="absolute inset-y-0 left-6 w-px bg-[#c9bfa9]" />
            </div>

            <header className="relative flex items-center justify-between gap-4 bg-foreground px-5 py-4 text-background md:px-10">
                <div className="flex min-w-0 flex-1 items-baseline gap-3">
                    <Link
                        href={home()}
                        className="min-w-0 truncate text-[13px] font-semibold tracking-[0.2em] uppercase decoration-2 underline-offset-[6px] hover:underline"
                    >
                        {name}
                    </Link>
                    <span
                        aria-hidden="true"
                        className="hidden h-0 flex-1 border-b border-dotted border-background/40 sm:block"
                    />
                </div>
                <span className="font-data text-[11px] tracking-[0.24em] whitespace-nowrap text-background/70">
                    FORMULIR MASUK
                </span>
            </header>

            <main className="relative flex flex-1 items-center justify-center px-5 py-10 sm:px-8 md:justify-start md:pl-16 lg:pl-24">
                <div className="w-full max-w-[29rem]">
                    <div className="flex flex-wrap items-start justify-between gap-x-5 gap-y-5">
                        <div className="min-w-0 flex-1 basis-64">
                            <h1 className="text-[1.7rem] leading-[1.1] font-semibold tracking-[-0.02em] sm:text-[1.9rem]">
                                {title}
                            </h1>
                            <p className="mt-3 max-w-[44ch] text-[0.95rem] leading-relaxed text-muted-foreground">
                                {description}
                            </p>
                        </div>

                        <div className="bon-stamp relative z-10 shrink-0 border-2 border-primary/85 px-2 py-1.5 text-center text-primary sm:translate-y-10">
                            <span className="block border border-primary/45 px-2 py-1.5">
                                <time
                                    dateTime={iso}
                                    className="block font-data text-[0.95rem] leading-none font-bold tracking-[0.06em]"
                                >
                                    {label}
                                </time>
                                <span className="mt-2 block font-data text-[0.56rem] leading-none tracking-[0.3em]">
                                    TANGGAL
                                </span>
                            </span>
                        </div>
                    </div>

                    <div aria-hidden="true" className="mt-6">
                        <div className="h-[2px] bg-foreground/85" />
                        <div className="mt-[3px] h-px bg-foreground/30" />
                    </div>

                    <div className="mt-4 flex items-baseline justify-between gap-3 font-data text-[11px] tracking-[0.18em] text-[#2b4a8b]">
                        <span>NO. {serial}</span>
                        <span className="text-muted-foreground">{weekday}</span>
                    </div>

                    <div className="mt-5">{children}</div>
                </div>
            </main>

            <footer className="relative flex items-center justify-between gap-4 border-t border-border bg-background px-5 py-3 font-data text-[11px] tracking-[0.16em] text-muted-foreground md:px-10">
                <span className="uppercase">{name}</span>
                <span className="text-right">JAGA KATA SANDI ANDA</span>
            </footer>
        </div>
    );
}
