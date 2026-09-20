<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StorePostRequest;
use App\Http\Requests\Admin\UpdatePostRequest;
use App\Http\Resources\PostResource;
use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class PostController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('can:viewAny,'.Post::class, only: ['index']),
            new Middleware('can:view,post', only: ['show']),
            new Middleware('can:create,'.Post::class, only: ['store']),
            new Middleware('can:update,post', only: ['update']),
            new Middleware('can:delete,post', only: ['destroy']),
        ];
    }

    /**
     * Display a listing of the resource.
     */
    public function index(): AnonymousResourceCollection
    {
        $posts = Post::with('tags')->latest()->get();

        return PostResource::collection($posts);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StorePostRequest $request): JsonResponse
    {
        $post = Post::create([
            ...$request->safe()->except('tag_ids'),
            'user_id' => $request->user()->id,
        ]);

        $post->tags()->sync($request->safe()->input('tag_ids', []));

        return (new PostResource($post->load('tags')))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    /**
     * Display the specified resource.
     */
    public function show(Post $post): PostResource
    {
        return new PostResource($post->load('tags'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdatePostRequest $request, Post $post): PostResource
    {
        $post->update($request->safe()->except('tag_ids'));

        if ($request->has('tag_ids')) {
            $post->tags()->sync($request->safe()->input('tag_ids', []));
        }

        return new PostResource($post->load('tags'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Post $post): Response
    {
        $post->delete();

        return response()->noContent();
    }
}
