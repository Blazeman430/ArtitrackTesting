<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Department;

class DepartmentSeeder extends Seeder
{
    public function run(): void
    {
        foreach (['HTM','PE','SCI','ICT'] as $code) {
            Department::firstOrCreate(
                ['code' => $code],
                ['name' => $code]
            );
        }
    }
}
