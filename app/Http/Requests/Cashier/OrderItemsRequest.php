<?php

namespace App\Http\Requests\Cashier;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class OrderItemsRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * Only active products may be ordered (Tech Spec FR-06).
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => [
                'required',
                'integer',
                Rule::exists('products', 'id')->where('is_active', true),
            ],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'items.required' => 'Keranjang pesanan tidak boleh kosong.',
            'items.*.product_id.exists' => 'Produk yang dipilih tidak tersedia.',
        ];
    }
}
