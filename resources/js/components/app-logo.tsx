import { usePage } from '@inertiajs/react';

/**
 * The store identity in the sidebar: a name written by hand, nothing else.
 *
 * The Laravel mark that used to sit next to it was not our brand, so it is
 * gone; the brand lives in the name and in the paper world around it.
 */
export default function AppLogo() {
    const { name } = usePage().props;

    return <span className="bon-brand truncate">{name}</span>;
}
