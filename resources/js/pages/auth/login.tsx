import { Form, Head } from '@inertiajs/react';
import PasskeyVerify from '@/components/passkey-verify';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
};

const fieldLabel =
    'font-slip shrink-0 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground';
const fieldInput = 'h-11 rounded-none bg-card px-3.5';
const fieldNote = 'text-destructive! font-medium';
const leader =
    'mb-[3px] h-0 min-w-4 flex-1 border-b border-dotted border-[#c2b9a4]';

export default function Login({ status, canResetPassword }: Props) {
    return (
        <>
            <Head title="Masuk" />

            <PasskeyVerify
                label="Masuk dengan passkey"
                loadingLabel="Memverifikasi passkey…"
                separator="atau gunakan email"
            />

            {status && (
                <p className="mb-1 font-data text-[13px] leading-snug text-[#2b4a8b]">
                    {status}
                </p>
            )}

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-5">
                            <div className="grid gap-2">
                                <div className="flex items-baseline gap-3">
                                    <Label
                                        htmlFor="email"
                                        className={fieldLabel}
                                    >
                                        Alamat email
                                    </Label>
                                    <span
                                        aria-hidden="true"
                                        className={leader}
                                    />
                                </div>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder="nama@restoran.com"
                                    className={fieldInput}
                                />
                                <InputError
                                    message={errors.email}
                                    className={fieldNote}
                                />
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-baseline gap-3">
                                    <Label
                                        htmlFor="password"
                                        className={fieldLabel}
                                    >
                                        Kata sandi
                                    </Label>
                                    <span
                                        aria-hidden="true"
                                        className={leader}
                                    />
                                    {canResetPassword && (
                                        <TextLink
                                            href={request()}
                                            tabIndex={5}
                                            className="shrink-0 text-[13px] font-normal text-muted-foreground decoration-muted-foreground/40 hover:text-primary"
                                        >
                                            Lupa kata sandi?
                                        </TextLink>
                                    )}
                                </div>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder="Kata sandi"
                                    className={fieldInput}
                                />
                                <InputError
                                    message={errors.password}
                                    className={fieldNote}
                                />
                            </div>

                            <div className="flex items-center gap-2.5">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    tabIndex={3}
                                />
                                <Label
                                    htmlFor="remember"
                                    className="text-[13px] font-medium text-foreground"
                                >
                                    Ingat saya
                                </Label>
                            </div>

                            <Button
                                type="submit"
                                className="mt-1 h-12 w-full rounded-none text-[13px] font-semibold tracking-[0.2em] uppercase shadow-none transition-colors active:translate-y-px"
                                tabIndex={4}
                                disabled={processing}
                                data-test="login-button"
                            >
                                {processing ? (
                                    <>
                                        <Spinner />
                                        Memproses…
                                    </>
                                ) : (
                                    'Masuk'
                                )}
                            </Button>
                        </div>

                        <div className="border-t border-border pt-5 text-center text-[13px] text-muted-foreground">
                            Belum punya akun?{' '}
                            <TextLink
                                href={register()}
                                tabIndex={5}
                                className="font-medium text-foreground decoration-foreground/40"
                            >
                                Daftar
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>
        </>
    );
}

Login.layout = {
    title: 'Masuk ke akun Anda',
    description:
        'Masukkan email dan kata sandi Anda untuk melanjutkan pekerjaan hari ini.',
};
