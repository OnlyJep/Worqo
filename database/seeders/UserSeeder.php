<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Profile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = [
            [
                'id' => 34,
                'username' => 'jemima.soliano',
                'email' => 'Jem@gmail.com',
                'password' => '$2y$10$4hJWi12axlyucmc9ffVyIu/bC0ebEn/XEoXENZNc39a',
                'role_id' => 2, // Employer
                'created_at' => '2025-11-06 08:46:12',
                'updated_at' => '2025-11-07 08:02:10',
                'last_activity' => '2025-11-07 08:02:10',
                'is_online' => 1,
                'archived' => 0,
                'profile' => [
                    'user_id' => 34,
                    'first_name' => 'Jemima',
                    'middlename' => null,
                    'last_name' => 'Soliano',
                    'gender_id' => 2, // Female
                    'suffix_id' => 2, // Sr.
                    'contact_number' => null,
                    'street' => 'gjhbj',
                    'city' => 'Butuan City',
                    'province' => 'Agusan Del Norte',
                    'postal_code' => '8600',
                    'country' => 'Philippines',
                    'profile_img' => 'profiles/ZylOvg93dBsyou86JcHZXYh1LyGmYgW6PPrlnQjE....',
                    'created_at' => '2025-11-06 08:46:12',
                    'updated_at' => '2025-11-07 03:41:52',
                ],
            ],
            [
                'id' => 35,
                'username' => 'jeff.ogabang',
                'email' => 'ogabang@gmail.com',
                'password' => '$2y$10$3YyYaZbuPDnKc1vc9nhbHeq4CyjCUoz.PPNQSgaZ6Zd',
                'role_id' => 1, // Worker
                'created_at' => '2025-11-06 09:08:31',
                'updated_at' => '2025-11-07 03:06:33',
                'last_activity' => '2025-11-07 03:06:33',
                'is_online' => 0,
                'archived' => 0,
                'profile' => [
                    'user_id' => 35,
                    'first_name' => 'Jeff',
                    'middlename' => 'malabo',
                    'last_name' => 'Ogabang',
                    'gender_id' => 1, // Male
                    'suffix_id' => null,
                    'contact_number' => null,
                    'street' => 'fhvvjhbhj',
                    'city' => 'Butuan City',
                    'province' => 'Agusan Del Norte',
                    'postal_code' => '8600',
                    'country' => 'Philippines',
                    'profile_img' => 'profiles/Irqcg6YJOg1lqzACCZ4zW6g2KEheGQgw0IMHrtB2....',
                    'created_at' => '2025-11-06 09:08:31',
                    'updated_at' => '2025-11-07 04:07:37',
                ],
            ],
            [
                'id' => 36,
                'username' => 'admin.account',
                'email' => 'account@admin.com',
                'password' => '$2y$10$woFpagCkEp3IV0Yb1UdoTuqNY2lGw197uyHWbirnQAn',
                'role_id' => 3, // Admin
                'created_at' => '2025-11-06 10:43:10',
                'updated_at' => '2025-11-06 13:28:29',
                'last_activity' => '2025-11-06 13:28:29',
                'is_online' => 0,
                'archived' => 0,
                'profile' => [
                    'user_id' => 36,
                    'first_name' => 'Admin',
                    'middlename' => null,
                    'last_name' => 'Account',
                    'gender_id' => 1, // Male
                    'suffix_id' => null,
                    'contact_number' => null,
                    'street' => null,
                    'city' => null,
                    'province' => null,
                    'postal_code' => null,
                    'country' => null,
                    'profile_img' => 'profiles/iceQUUe1HlBmDc8xbf1KK7gT8v7uruSE3Rk8Ie7P....',
                    'created_at' => '2025-11-06 10:43:10',
                    'updated_at' => '2025-11-07 03:40:11',
                ],
            ],
            [
                'id' => 37,
                'username' => 'jamaica.soliano',
                'email' => 'Jamaica@gmail.com',
                'password' => '$2y$10$DczM3OcvpL2lyRTIMhLMu.3eyKgRen5ZDSgipCW55Rr',
                'role_id' => 2, // Employer
                'created_at' => '2025-11-07 02:54:25',
                'updated_at' => '2025-11-07 08:01:40',
                'last_activity' => '2025-11-07 08:01:40',
                'is_online' => 1,
                'archived' => 0,
                'profile' => [
                    'user_id' => 37,
                    'first_name' => 'Jamaica',
                    'middlename' => 'Cuyno',
                    'last_name' => 'Soliano',
                    'gender_id' => 1, // Male
                    'suffix_id' => null,
                    'contact_number' => null,
                    'street' => null,
                    'city' => 'Butuan City',
                    'province' => 'Agusan Del Norte',
                    'postal_code' => '8600',
                    'country' => 'Philippines',
                    'profile_img' => 'profiles/F7k9ILhKyqGnLlqwk1FeB1vk0SsnoglU8ArWffRU....',
                    'created_at' => '2025-11-07 02:54:25',
                    'updated_at' => '2025-11-07 03:37:27',
                ],
            ],
            [
                'id' => 38,
                'username' => 'catalina.cuyno',
                'email' => 'nella@gmail.com',
                'password' => '$2y$10$Z6PSNsNBWi05OTlc7okKGu0m23kfTOYt0lwolLU9CXP',
                'role_id' => 3, // Admin
                'created_at' => '2025-11-07 02:57:29',
                'updated_at' => '2025-11-07 02:58:50',
                'last_activity' => '2025-11-07 02:58:50',
                'is_online' => 1,
                'archived' => 0,
                'profile' => [
                    'user_id' => 38,
                    'first_name' => 'Catalina',
                    'middlename' => null,
                    'last_name' => 'Cuyno',
                    'gender_id' => 2, // Female
                    'suffix_id' => null,
                    'contact_number' => null,
                    'street' => null,
                    'city' => null,
                    'province' => null,
                    'postal_code' => null,
                    'country' => null,
                    'profile_img' => 'profiles/eLlqIfpdDLKNMd44PqrMalIxW7cLUqhkiH6Dv9Z9....',
                    'created_at' => '2025-11-07 02:57:29',
                    'updated_at' => '2025-11-07 02:59:19',
                ],
            ],
            [
                'id' => 39,
                'username' => 'efs.s',
                'email' => 'soliano1@gmail.com',
                'password' => '$2y$10$woOklkkyXh3wKF5fBcgReuyjaMWRptVXzro.cRapd.U',
                'role_id' => 1, // Worker
                'created_at' => '2025-11-07 08:10:03',
                'updated_at' => '2025-11-07 08:10:03',
                'last_activity' => null,
                'is_online' => 0,
                'archived' => 0,
                'profile' => [
                    'user_id' => 39,
                    'first_name' => 'efs',
                    'middlename' => null,
                    'last_name' => 's',
                    'gender_id' => 2, // Female
                    'suffix_id' => null,
                    'contact_number' => '32569532',
                    'street' => 'edfaf',
                    'city' => 'Butuan City',
                    'province' => 'Agusan Del Norte',
                    'postal_code' => '8600',
                    'country' => 'Philippines',
                    'profile_img' => 'profiles/690da95b9b09a.jpg',
                    'created_at' => '2025-11-07 08:10:03',
                    'updated_at' => '2025-11-07 08:10:03',
                ],
            ],
        ];

        // Map of user_id to profile_id based on provided data
        $profileIdMap = [
            34 => 33,
            35 => 34,
            36 => 35,
            37 => 36,
            38 => 37,
            39 => 38,
        ];

        foreach ($users as $userData) {
            try {
                $profileData = $userData['profile'];
                unset($userData['profile']);

                // Check if user already exists
                $userExists = DB::table('users')->where('id', $userData['id'])->exists();
                
                if (!$userExists) {
                    // Insert user with specific ID
                    DB::table('users')->insert([
                        'id' => $userData['id'],
                        'username' => $userData['username'],
                        'email' => $userData['email'],
                        'password' => $userData['password'],
                        'role_id' => $userData['role_id'],
                        'last_activity' => $userData['last_activity'] ? Carbon::parse($userData['last_activity']) : null,
                        'is_online' => $userData['is_online'],
                        'archived' => $userData['archived'],
                        'created_at' => Carbon::parse($userData['created_at']),
                        'updated_at' => Carbon::parse($userData['updated_at']),
                    ]);

                    // Insert profile - let database auto-increment ID if it fails
                    $profileId = $profileIdMap[$userData['id']] ?? null;
                    try {
                        if ($profileId) {
                            DB::table('profiles')->insert([
                                'id' => $profileId,
                                'user_id' => $profileData['user_id'],
                                'first_name' => $profileData['first_name'],
                                'middlename' => $profileData['middlename'],
                                'last_name' => $profileData['last_name'],
                                'gender_id' => $profileData['gender_id'],
                                'suffix_id' => $profileData['suffix_id'],
                                'contact_number' => $profileData['contact_number'],
                                'street' => $profileData['street'],
                                'city' => $profileData['city'],
                                'province' => $profileData['province'],
                                'postal_code' => $profileData['postal_code'],
                                'country' => $profileData['country'],
                                'profile_img' => $profileData['profile_img'],
                                'created_at' => Carbon::parse($profileData['created_at']),
                                'updated_at' => Carbon::parse($profileData['updated_at']),
                            ]);
                        } else {
                            // Let database auto-increment
                            DB::table('profiles')->insert([
                                'user_id' => $profileData['user_id'],
                                'first_name' => $profileData['first_name'],
                                'middlename' => $profileData['middlename'],
                                'last_name' => $profileData['last_name'],
                                'gender_id' => $profileData['gender_id'],
                                'suffix_id' => $profileData['suffix_id'],
                                'contact_number' => $profileData['contact_number'],
                                'street' => $profileData['street'],
                                'city' => $profileData['city'],
                                'province' => $profileData['province'],
                                'postal_code' => $profileData['postal_code'],
                                'country' => $profileData['country'],
                                'profile_img' => $profileData['profile_img'],
                                'created_at' => Carbon::parse($profileData['created_at']),
                                'updated_at' => Carbon::parse($profileData['updated_at']),
                            ]);
                        }
                    } catch (\Exception $e) {
                        // If profile insert fails, try without ID
                        DB::table('profiles')->insert([
                            'user_id' => $profileData['user_id'],
                            'first_name' => $profileData['first_name'],
                            'middlename' => $profileData['middlename'],
                            'last_name' => $profileData['last_name'],
                            'gender_id' => $profileData['gender_id'],
                            'suffix_id' => $profileData['suffix_id'],
                            'contact_number' => $profileData['contact_number'],
                            'street' => $profileData['street'],
                            'city' => $profileData['city'],
                            'province' => $profileData['province'],
                            'postal_code' => $profileData['postal_code'],
                            'country' => $profileData['country'],
                            'profile_img' => $profileData['profile_img'],
                            'created_at' => Carbon::parse($profileData['created_at']),
                            'updated_at' => Carbon::parse($profileData['updated_at']),
                        ]);
                    }
                } else {
                    // Update existing user (don't update password if it's the same hash)
                    DB::table('users')->where('id', $userData['id'])->update([
                        'username' => $userData['username'],
                        'email' => $userData['email'],
                        'role_id' => $userData['role_id'],
                        'last_activity' => $userData['last_activity'] ? Carbon::parse($userData['last_activity']) : null,
                        'is_online' => $userData['is_online'],
                        'archived' => $userData['archived'],
                        'updated_at' => Carbon::parse($userData['updated_at']),
                    ]);

                    // Update or insert profile
                    $profileExists = DB::table('profiles')->where('user_id', $profileData['user_id'])->exists();
                    
                    if ($profileExists) {
                        DB::table('profiles')->where('user_id', $profileData['user_id'])->update([
                            'first_name' => $profileData['first_name'],
                            'middlename' => $profileData['middlename'],
                            'last_name' => $profileData['last_name'],
                            'gender_id' => $profileData['gender_id'],
                            'suffix_id' => $profileData['suffix_id'],
                            'contact_number' => $profileData['contact_number'],
                            'street' => $profileData['street'],
                            'city' => $profileData['city'],
                            'province' => $profileData['province'],
                            'postal_code' => $profileData['postal_code'],
                            'country' => $profileData['country'],
                            'profile_img' => $profileData['profile_img'],
                            'updated_at' => Carbon::parse($profileData['updated_at']),
                        ]);
                    } else {
                        // Insert new profile
                        $profileId = $profileIdMap[$userData['id']] ?? null;
                        try {
                            if ($profileId) {
                                DB::table('profiles')->insert([
                                    'id' => $profileId,
                                    'user_id' => $profileData['user_id'],
                                    'first_name' => $profileData['first_name'],
                                    'middlename' => $profileData['middlename'],
                                    'last_name' => $profileData['last_name'],
                                    'gender_id' => $profileData['gender_id'],
                                    'suffix_id' => $profileData['suffix_id'],
                                    'contact_number' => $profileData['contact_number'],
                                    'street' => $profileData['street'],
                                    'city' => $profileData['city'],
                                    'province' => $profileData['province'],
                                    'postal_code' => $profileData['postal_code'],
                                    'country' => $profileData['country'],
                                    'profile_img' => $profileData['profile_img'],
                                    'created_at' => Carbon::parse($profileData['created_at']),
                                    'updated_at' => Carbon::parse($profileData['updated_at']),
                                ]);
                            } else {
                                DB::table('profiles')->insert([
                                    'user_id' => $profileData['user_id'],
                                    'first_name' => $profileData['first_name'],
                                    'middlename' => $profileData['middlename'],
                                    'last_name' => $profileData['last_name'],
                                    'gender_id' => $profileData['gender_id'],
                                    'suffix_id' => $profileData['suffix_id'],
                                    'contact_number' => $profileData['contact_number'],
                                    'street' => $profileData['street'],
                                    'city' => $profileData['city'],
                                    'province' => $profileData['province'],
                                    'postal_code' => $profileData['postal_code'],
                                    'country' => $profileData['country'],
                                    'profile_img' => $profileData['profile_img'],
                                    'created_at' => Carbon::parse($profileData['created_at']),
                                    'updated_at' => Carbon::parse($profileData['updated_at']),
                                ]);
                            }
                        } catch (\Exception $e) {
                            // If profile insert fails with ID, try without
                            DB::table('profiles')->insert([
                                'user_id' => $profileData['user_id'],
                                'first_name' => $profileData['first_name'],
                                'middlename' => $profileData['middlename'],
                                'last_name' => $profileData['last_name'],
                                'gender_id' => $profileData['gender_id'],
                                'suffix_id' => $profileData['suffix_id'],
                                'contact_number' => $profileData['contact_number'],
                                'street' => $profileData['street'],
                                'city' => $profileData['city'],
                                'province' => $profileData['province'],
                                'postal_code' => $profileData['postal_code'],
                                'country' => $profileData['country'],
                                'profile_img' => $profileData['profile_img'],
                                'created_at' => Carbon::parse($profileData['created_at']),
                                'updated_at' => Carbon::parse($profileData['updated_at']),
                            ]);
                        }
                    }
                }
            } catch (\Exception $e) {
                $this->command->warn("Failed to seed user {$userData['username']}: " . $e->getMessage());
                continue;
            }
        }

        $this->command->info('Users and profiles seeded successfully!');
    }
}

