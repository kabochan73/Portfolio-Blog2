<?php

namespace App\Http\Requests\Admin;

use App\Enums\PostStatus;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePostRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:30'],
            'slug' => ['required', 'string', 'max:30', 'alpha_dash', Rule::unique('posts', 'slug')],
            'body' => ['required', 'string'],
            'status' => ['required', Rule::enum(PostStatus::class)],
            'tag_ids' => ['nullable', 'array'],
            'tag_ids.*' => [Rule::exists('tags', 'id')],
        ];
    }
}
