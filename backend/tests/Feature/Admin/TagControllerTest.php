<?php

use App\Models\Tag;
use App\Models\User;

test('a guest cannot access any admin tag endpoint', function () {
    $tag = Tag::factory()->create();

    $this->getJson('/api/admin/tags')->assertUnauthorized();
    $this->postJson('/api/admin/tags', [])->assertUnauthorized();
    $this->putJson("/api/admin/tags/{$tag->id}", [])->assertUnauthorized();
    $this->deleteJson("/api/admin/tags/{$tag->id}")->assertUnauthorized();
});

test('a tag can be created', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->postJson('/api/admin/tags', ['name' => 'laravel']);

    $response->assertCreated()->assertJsonPath('data.name', 'laravel');
    $this->assertDatabaseHas('tags', ['name' => 'laravel']);
});

test('creating a tag rejects a duplicate name', function () {
    Tag::factory()->create(['name' => 'laravel']);
    $user = User::factory()->create();

    $response = $this->actingAs($user)->postJson('/api/admin/tags', ['name' => 'laravel']);

    $response->assertUnprocessable()->assertJsonValidationErrors('name');
});

test('creating a tag rejects a name over 12 characters', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->postJson('/api/admin/tags', ['name' => 'way-too-long-a-name']);

    $response->assertUnprocessable()->assertJsonValidationErrors('name');
});

test('a tag can be updated', function () {
    $user = User::factory()->create();
    $tag = Tag::factory()->create(['name' => 'old']);

    $response = $this->actingAs($user)->putJson("/api/admin/tags/{$tag->id}", ['name' => 'new']);

    $response->assertOk()->assertJsonPath('data.name', 'new');
});

test('updating a tag with its own name is allowed', function () {
    $user = User::factory()->create();
    $tag = Tag::factory()->create(['name' => 'same']);

    $response = $this->actingAs($user)->putJson("/api/admin/tags/{$tag->id}", ['name' => 'same']);

    $response->assertOk();
});

test('a tag can be deleted', function () {
    $user = User::factory()->create();
    $tag = Tag::factory()->create();

    $response = $this->actingAs($user)->deleteJson("/api/admin/tags/{$tag->id}");

    $response->assertNoContent();
    $this->assertDatabaseMissing('tags', ['id' => $tag->id]);
});
