<?php

namespace App\Http\Controllers;

use App\Enums\PostStatus;
use App\Http\Resources\PostResource;
use App\Models\Post;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PostController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $posts = Post::where('status', PostStatus::Published)
            ->with('tags')
            ->latest('created_at')
            ->get();

        return PostResource::collection($posts);
    }

    public function show(string $slug): PostResource
    {
        $post = Post::where('status', PostStatus::Published)
            ->where('slug', $slug)
            ->with('tags')
            ->firstOrFail();

        return new PostResource($post);
    }
}
