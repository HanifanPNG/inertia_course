<?php

namespace App\Http\Requests\Cashier;

use App\Enums\OrderStatus;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class OrderStatusRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * Kasir may only move an order forward to `completed`. `paid` is set by
     * the payment flow (T-13) and `pending` is the initial state.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'status' => ['required', Rule::enum(OrderStatus::class), Rule::in([OrderStatus::Completed])],
        ];
    }
}
