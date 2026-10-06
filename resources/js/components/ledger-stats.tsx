export type LedgerStat = {
    label: string;
    value: string;
};

export function LedgerStats({
    stats,
    className,
}: {
    stats: LedgerStat[];
    className?: string;
}) {
    return (
        <section aria-label="Ringkasan angka" className={className}>
            <div className="grid grid-cols-2 gap-px border-x border-t border-border bg-border sm:grid-cols-4">
                {stats.map((stat) => (
                    <div key={stat.label} className="min-w-0 bg-card px-4 py-4">
                        <p className="font-data text-[10.5px] tracking-[0.2em] text-muted-foreground uppercase">
                            {stat.label}
                        </p>
                        <p className="mt-2 font-data text-[1.05rem] leading-none font-bold tracking-tight text-foreground tabular-nums sm:text-[1.35rem]">
                            {stat.value}
                        </p>
                    </div>
                ))}
            </div>
            <div aria-hidden="true" className="bon-rule" />
        </section>
    );
}
