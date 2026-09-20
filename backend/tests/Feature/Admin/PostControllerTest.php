<?php

use App\Enums\PostStatus;
use App\Models\Post;
use App\Models\Tag;
use App\Models\User;

test('a guest cannot access any admin post endpoint', function () {
    $post = Post::factory()->create();

    $this->getJson('/api/admin/posts')->assertUnauthorized();
    $this->postJson('/api/admin/posts', [])->assertUnauthorized();
    $this->getJson("/api/admin/posts/{$post->id}")->assertUnauthorized();
    $this->putJson("/api/admin/posts/{$post->id}", [])->assertUnauthorized();
    $this->deleteJson("/api/admin/posts/{$post->id}")->assertUnauthorized();
});

test('the index includes drafts as well as published posts', function () {
    $user = User::factory()->create();
    Post::factory()->for($user)->published()->create();
    Post::factory()->for($user)->create(['status' => PostStatus::Draft]);

    $response = $this->actingAs($user)->getJson('/api/admin/posts');

    $response->assertOk()->assertJsonCount(2, 'data');
});

test('a post can be created with tags attached', function () {
    $user = User::factory()->create();
    $tags = Tag::factory()->count(2)->create();

    $response = $this->actingAs($user)->postJson('/api/admin/posts', [
        'title' => 'A new post',
        'slug' => 'a-new-post',
        'body' => 'Some body text.',
        'status' => 'draft',
        'tag_ids' => $tags->pluck('id')->all(),
    ]);

    $response->assertCreated()
        ->assertJsonCount(2, 'data.tags');

    $this->assertDatabaseHas('posts', [
        'slug' => 'a-new-post',
        'user_id' => $user->id,
    ]);
});

test('creating a post requires the core fields', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->postJson('/api/admin/posts', []);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['title', 'slug', 'body', 'status']);
});

test('creating a post rejects a duplicate slug', function () {
    $user = User::factory()->create();
    Post::factory()->for($user)->create(['slug' => 'taken']);

    $response = $this->actingAs($user)->postJson('/api/admin/posts', [
        'title' => 'Another post',
        'slug' => 'taken',
        'body' => 'Body.',
        'status' => 'draft',
    ]);

    $response->assertUnprocessable()->assertJsonValidationErrors('slug');
});

test('creating a post rejects an invalid status', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->postJson('/api/admin/posts', [
        'title' => 'A post',
        'slug' => 'a-post',
        'body' => 'Body.',
        'status' => 'not-a-real-status',
    ]);

    $response->assertUnprocessable()->assertJsonValidationErrors('status');
});

test('a post can be updated', function () {
    $user = User::factory()->create();
    $post = Post::factory()->for($user)->create(['title' => 'Old title']);

    $response = $this->actingAs($user)->putJson("/api/admin/posts/{$post->id}", [
        'title' => 'New title',
    ]);

    $response->assertOk()->assertJsonPath('data.title', 'New title');
});

test('omitting tag_ids on update keeps the existing tags', function () {
    $user = User::factory()->create();
    $post = Post::factory()->for($user)->create();
    $tag = Tag::factory()->create();
    $post->tags()->attach($tag);

    $response = $this->actingAs($user)->putJson("/api/admin/posts/{$post->id}", [
        'title' => 'Updated title',
    ]);

    $response->assertOk();
    expect($post->fresh()->tags)->toHaveCount(1);
});

test('a post can be deleted by its owner', function () {
    $user = User::factory()->create();
    $post = Post::factory()->for($user)->create();

    $response = $this->actingAs($user)->deleteJson("/api/admin/posts/{$post->id}");

    $response->assertNoContent();
    $this->assertDatabaseMissing('posts', ['id' => $post->id]);
});

test('a user cannot update or delete someone else\'s post', function () {
    $owner = User::factory()->create();
    $otherUser = User::factory()->create();
    $post = Post::factory()->for($owner)->create();

    $this->actingAs($otherUser)
        ->putJson("/api/admin/posts/{$post->id}", ['title' => 'Hijacked'])
        ->assertForbidden();

    $this->actingAs($otherUser)
        ->deleteJson("/api/admin/posts/{$post->id}")
        ->assertForbidden();

    $this->assertDatabaseHas('posts', ['id' => $post->id, 'title' => $post->title]);
});
