<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Akun default untuk login saat development.
     *
     * Password diambil dari config `app.seed_user_password` (env `SEED_USER_PASSWORD`),
     * default `password`. Dihash otomatis oleh cast `hashed` pada model `User`.
     *
     * @var list<array{name: string, email: string, role: string}>
     */
    private const USERS = [
        [
            'name' => 'Admin Restoran',
            'email' => 'admin@example.com',
            'role' => User::ROLE_ADMIN,
        ],
        [
            'name' => 'Kasir Restoran',
            'email' => 'cashier@example.com',
            'role' => User::ROLE_CASHIER,
        ],
    ];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $password = config('app.seed_user_password');

        foreach (self::USERS as $account) {
            User::updateOrCreate(
                ['email' => $account['email']],
                [
                    'name' => $account['name'],
                    'role' => $account['role'],
                    'email_verified_at' => now(),
                    'password' => $password,
                ],
            );
        }
    }
}
