<?php

use App\Models\User;

test('a user can log in with correct credentials', function () {
    $user = User::factory()->create(['password' => 'correct-password']);

    $response = $this->withHeaders(fromFrontend())->postJson('/api/login', [
        'email' => $user->email,
        'password' => 'correct-password',
    ]);

    $response->assertOk()
        ->assertJsonPath('user.email', $user->email);

    $this->assertAuthenticatedAs($user);
});

test('logging in with the wrong password fails with a generic email error', function () {
    $user = User::factory()->create(['password' => 'correct-password']);

    $response = $this->withHeaders(fromFrontend())->postJson('/api/login', [
        'email' => $user->email,
        'password' => 'wrong-password',
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors('email');

    $this->assertGuest();
});

test('logging in with a nonexistent email fails with the same generic error', function () {
    $response = $this->withHeaders(fromFrontend())->postJson('/api/login', [
        'email' => 'nobody@example.com',
        'password' => 'whatever',
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors('email');

    $this->assertGuest();
});

test('email and password are required', function () {
    $response = $this->withHeaders(fromFrontend())->postJson('/api/login', []);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['email', 'password']);
});
