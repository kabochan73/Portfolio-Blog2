<?php

use App\Enums\PostStatus;
use App\Models\Post;
use App\Models\Tag;

test('only published posts appear in the index', function () {
    Post::factory()->published()->create(['title' => 'Published post']);
    Post::factory()->create(['title' => 'Draft post', 'status' => PostStatus::Draft]);

    $response = $this->getJson('/api/posts');

    $response->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.title', 'Published post');
});

test('the index includes each post\'s tags', function () {
    $post = Post::factory()->published()->create();
    $tag = Tag::factory()->create();
    $post->tags()->attach($tag);

    $response = $this->getJson('/api/posts');

    $response->assertOk()
        ->assertJsonPath('data.0.tags.0.id', $tag->id);
});

test('a published post can be shown by slug', function () {
    $post = Post::factory()->published()->create(['slug' => 'hello-world']);

    $response = $this->getJson('/api/posts/hello-world');

    $response->assertOk()
        ->assertJsonPath('data.slug', 'hello-world');
});

test('a draft post 404s when shown by slug', function () {
    Post::factory()->create(['slug' => 'still-a-draft', 'status' => PostStatus::Draft]);

    $response = $this->getJson('/api/posts/still-a-draft');

    $response->assertNotFound()
        ->assertJson(['message' => 'Not Found.']);
});

test('a nonexistent slug 404s', function () {
    $response = $this->getJson('/api/posts/does-not-exist');

    $response->assertNotFound()
        ->assertJson(['message' => 'Not Found.']);
});
