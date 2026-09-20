<?php

use App\Models\Post;
use App\Models\User;

test('the owner can update and delete their own post', function () {
    $owner = User::factory()->create();
    $post = Post::factory()->for($owner)->create();

    expect($owner->can('update', $post))->toBeTrue()
        ->and($owner->can('delete', $post))->toBeTrue();
});

test('another user cannot update or delete someone else\'s post', function () {
    $owner = User::factory()->create();
    $otherUser = User::factory()->create();
    $post = Post::factory()->for($owner)->create();

    expect($otherUser->can('update', $post))->toBeFalse()
        ->and($otherUser->can('delete', $post))->toBeFalse();
});

test('any authenticated user can view and create posts', function () {
    $user = User::factory()->create();
    $post = Post::factory()->create();

    expect($user->can('viewAny', Post::class))->toBeTrue()
        ->and($user->can('view', $post))->toBeTrue()
        ->and($user->can('create', Post::class))->toBeTrue();
});
