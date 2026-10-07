import AuthLayoutTemplate from '@/layouts/auth/auth-simple-layout';

export default function AuthLayout({
    title = '',
    description = '',
    aside,
    children,
}: {
    title?: string;
    description?: string;
    aside?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <AuthLayoutTemplate
            title={title}
            description={description}
            aside={aside}
        >
            {children}
        </AuthLayoutTemplate>
    );
}
