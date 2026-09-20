<?php

use App\Models\Tag;

test('tags are returned sorted by name', function () {
    Tag::factory()->create(['name' => 'zeta']);
    Tag::factory()->create(['name' => 'alpha']);

    $response = $this->getJson('/api/tags');

    $response->assertOk()
        ->assertJsonPath('data.0.name', 'alpha')
        ->assertJsonPath('data.1.name', 'zeta');
});
