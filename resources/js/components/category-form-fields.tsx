import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export type CategoryFormValues = {
    name: string;
    description: string;
};

export type CategoryFormErrors = Partial<
    Record<keyof CategoryFormValues, string>
>;

export default function CategoryFormFields({
    values,
    errors,
    idPrefix,
}: {
    values: CategoryFormValues;
    errors: CategoryFormErrors;
    idPrefix: string;
}) {
    return (
        <>
            <div className="grid gap-2">
                <Label htmlFor={`${idPrefix}-name`}>Nama Kategori</Label>

                <Input
                    id={`${idPrefix}-name`}
                    name="name"
                    defaultValue={values.name}
                    required
                    autoComplete="off"
                    placeholder="Contoh: Makanan"
                />

                <InputError message={errors.name} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor={`${idPrefix}-description`}>Deskripsi</Label>

                <textarea
                    id={`${idPrefix}-description`}
                    name="description"
                    defaultValue={values.description}
                    rows={3}
                    placeholder="Opsional"
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
                />

                <InputError message={errors.description} />
            </div>
        </>
    );
}
