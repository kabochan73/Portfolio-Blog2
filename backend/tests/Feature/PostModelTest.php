<?php

use App\Enums\PostStatus;
use App\Models\Post;
use App\Models\Tag;
use App\Models\User;

test('status is cast to a PostStatus enum', function () {
    $post = Post::factory()->create(['status' => PostStatus::Published]);

    expect($post->fresh()->status)->toBe(PostStatus::Published);
});

test('a post belongs to a user', function () {
    $user = User::factory()->create();
    $post = Post::factory()->for($user)->create();

    expect($post->user)->toBeInstanceOf(User::class)
        ->and($post->user->id)->toBe($user->id);
});

test('a post can have many tags', function () {
    $post = Post::factory()->create();
    $tags = Tag::factory()->count(2)->create();

    $post->tags()->attach($tags);

    expect($post->fresh()->tags)->toHaveCount(2);
});
