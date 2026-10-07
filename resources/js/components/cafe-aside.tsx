/**
 * The place, pasted onto the ledger sheet beside the login form.
 *
 * Sharp corners, a hairline frame, and the same double rule the form uses, so
 * the photograph reads as an attachment to the sheet rather than a banner.
 */
export default function CafeAside() {
    return (
        <figure>
            <div className="flex items-baseline gap-3 border-b border-foreground/25 pb-2">
                <figcaption className="font-data text-[11px] tracking-[0.24em] uppercase">
                    is About
                </figcaption>
                <span
                    aria-hidden="true"
                    className="min-w-4 flex-1 translate-y-[-3px] border-b border-dotted border-border"
                />
                <span className="font-data text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
                    4U
                </span>
            </div>

            <img
                src="/images/cafe.webp"
                alt="Ruang luar 4U Resto & cafe: bangunan beratap jeruji, meja kayu di taman, dan pelanggan yang sedang makan"
                width={1282}
                height={1227}
                fetchPriority="high"
                className="mt-3 block max-h-[clamp(14rem,54svh,30rem)] w-full rounded-none border border-border object-cover object-[center_42%]"
            />
        </figure>
    );
}
