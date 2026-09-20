<?php

namespace App\Http\Requests\Admin;

use App\Enums\PostStatus;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePostRequest extends FormRequest
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
            'title' => ['sometimes', 'required', 'string', 'max:30'],
            'slug' => ['sometimes', 'required', 'string', 'max:30', 'alpha_dash', Rule::unique('posts', 'slug')->ignore($this->route('post'))],
            'body' => ['sometimes', 'required', 'string'],
            'status' => ['sometimes', 'required', Rule::enum(PostStatus::class)],
            'tag_ids' => ['sometimes', 'nullable', 'array'],
            'tag_ids.*' => [Rule::exists('tags', 'id')],
        ];
    }
}
