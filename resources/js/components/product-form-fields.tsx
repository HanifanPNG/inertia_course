import { useState } from 'react';
import InputError from '@/components/input-error';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export type CategoryOption = {
    id: number;
    name: string;
};

export type ProductFormValues = {
    category_id: string;
    name: string;
    description: string;
    price: string;
    is_active: boolean;
};

export type ProductFormErrors = Partial<
    Record<keyof ProductFormValues | 'image', string>
>;

export default function ProductFormFields({
    values,
    errors,
    categories,
    idPrefix,
    currentImageUrl = null,
}: {
    values: ProductFormValues;
    errors: ProductFormErrors;
    categories: CategoryOption[];
    idPrefix: string;
    currentImageUrl?: string | null;
}) {
    const [preview, setPreview] = useState<string | null>(currentImageUrl);

    return (
        <>
            <div className="grid gap-2">
                <Label htmlFor={`${idPrefix}-name`}>Nama Produk</Label>

                <Input
                    id={`${idPrefix}-name`}
                    name="name"
                    defaultValue={values.name}
                    required
                    autoComplete="off"
                    placeholder="Contoh: Nasi Goreng"
                />

                <InputError message={errors.name} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor={`${idPrefix}-category`}>Kategori</Label>

                <select
                    id={`${idPrefix}-category`}
                    name="category_id"
                    defaultValue={values.category_id}
                    required
                    className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive dark:bg-input/30"
                >
                    <option value="">Pilih kategori</option>

                    {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                            {category.name}
                        </option>
                    ))}
                </select>

                <InputError message={errors.category_id} />
            </div>

            <div className="grid gap-2">
                <Label htmlFor={`${idPrefix}-price`}>Harga</Label>

                <Input
                    id={`${idPrefix}-price`}
                    name="price"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={values.price}
                    required
                    placeholder="0.00"
                />

                <InputError message={errors.price} />
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

            <div className="grid gap-2">
                <Label htmlFor={`${idPrefix}-image`}>Gambar</Label>

                <input
                    id={`${idPrefix}-image`}
                    name="image"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(event) => {
                        const file = event.target.files?.[0];

                        setPreview(
                            file ? URL.createObjectURL(file) : currentImageUrl,
                        );
                    }}
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1 file:text-sm file:font-medium focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30"
                />

                <p className="text-xs text-muted-foreground">
                    Format JPG, PNG, atau WEBP. Maksimal 2 MB. Biarkan kosong
                    bila tidak ingin mengubah gambar.
                </p>

                {preview && (
                    <img
                        src={preview}
                        alt="Pratinjau gambar produk"
                        className="mt-1 h-32 w-32 rounded-lg border border-sidebar-border/70 object-cover dark:border-sidebar-border"
                    />
                )}

                <InputError message={errors.image} />
            </div>

            <div className="grid gap-2">
                <input type="hidden" name="is_active" value="0" />

                <div className="flex items-center gap-2">
                    <Checkbox
                        id={`${idPrefix}-is_active`}
                        name="is_active"
                        value="1"
                        defaultChecked={values.is_active}
                    />

                    <Label htmlFor={`${idPrefix}-is_active`}>
                        Aktif dan bisa dipesan
                    </Label>
                </div>

                <InputError message={errors.is_active} />
            </div>
        </>
    );
}
