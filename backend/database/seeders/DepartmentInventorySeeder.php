<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Department;
use App\Models\Inventory;

class DepartmentInventorySeeder extends Seeder
{
    public function run(): void
    {
        $depts = [
            ['code'=>'HTM','name'=>'Hotel & Tourism Management'],
            ['code'=>'PE', 'name'=>'Physical Education'],
            ['code'=>'SCI','name'=>'Science'],
            ['code'=>'ICT','name'=>'Information & Communications Tech'],
        ];

        foreach ($depts as $d) {
            $dep = Department::firstOrCreate(['code'=>$d['code']], ['name'=>$d['name']]);
            Inventory::firstOrCreate(['department_id'=>$dep->id, 'name'=>'Main']);
        }
    }
}
