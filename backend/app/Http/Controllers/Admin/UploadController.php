<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreUploadRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class UploadController extends Controller
{
    /**
     * Store an uploaded thumbnail image and return its storage path and a
     * temporary preview URL.
     */
    public function store(StoreUploadRequest $request): JsonResponse
    {
        $file = $request->file('thumbnail');
        $path = $file->storeAs('thumbnails', Str::uuid().'.'.$file->extension(), 's3');

        return response()->json([
            'data' => [
                'thumbnail_path' => $path,
                'thumbnail_url' => Storage::disk('s3')->temporaryUrl($path, now()->addDays(7)),
            ],
        ], 201);
    }
}
