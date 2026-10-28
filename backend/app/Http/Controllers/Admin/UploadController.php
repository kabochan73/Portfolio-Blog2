<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreUploadRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
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

        if ($path === false) {
            // The s3 disk has 'throw' => false, so a failed PUT (e.g. bad
            // credentials) returns false here instead of throwing. Fail
            // clearly now rather than passing an empty path on to
            // temporaryUrl(), which raises a confusing AWS SDK validation
            // error instead of describing the actual problem.
            Log::error('Thumbnail upload to S3 failed.');

            return response()->json([
                'message' => '画像のアップロードに失敗しました。',
            ], 502);
        }

        return response()->json([
            'data' => [
                'thumbnail_path' => $path,
                'thumbnail_url' => Storage::disk('s3')->temporaryUrl($path, now()->addDays(7)),
            ],
        ], 201);
    }
}
