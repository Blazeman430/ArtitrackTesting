<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Response;
use Illuminate\Support\Facades\Auth;
use League\Csv\Reader;
use App\Models\User;

class AuthController extends Controller
{
    protected function csvUsers(): array
    {
        $path  = storage_path('app/auth/users.csv');
        if (!is_file($path)) return [];

        $mtime = @filemtime($path) ?: 0;
        $key   = "csv_auth_users_v1_{$mtime}";

        return Cache::remember($key, 600, function () use ($path) {
            $csv = Reader::createFromPath($path, 'r');
            $csv->setHeaderOffset(0);

            $rows = [];
            foreach ($csv->getRecords() as $r) {
                $email = strtolower(trim($r['email'] ?? ''));
                if (!$email) continue;
                $rows[$email] = [
                    'email'      => $email,
                    'name'       => trim($r['name'] ?? ''),
                    'role'       => trim($r['role'] ?? ''),
                    'dept'       => trim($r['dept'] ?? ''),
                    'account_no' => trim($r['account_no'] ?? ''),
                    'photo_url'  => trim($r['photo_url'] ?? ''),
                    'is_active'  => ($r['is_active'] ?? '1') ? true : false,
                ];
            }
            return $rows;
        });
    }

    public function login(Request $req)
    {
        // CSRF is handled by Sanctum's /sanctum/csrf-cookie + XSRF-TOKEN header
        $data  = $req->validate(['email' => ['required', 'email']]);
        $email = strtolower($data['email']);

        $rows = $this->csvUsers();
        if (!isset($rows[$email])) {
            return Response::json(['message' => 'Email not found in authorized list'], 401);
        }
        $row = $rows[$email];
        if (!$row['is_active']) {
            return Response::json(['message' => 'Account is disabled'], 403);
        }

        // Create/update the user record
        $user = User::updateOrCreate(
            ['email' => $row['email']],
            [
                'name'          => $row['name'] ?: $row['email'],
                'role'          => $row['role'] ?: null,
                'dept'          => $row['dept'] ?: null,
                'account_no'    => $row['account_no'] ?: null,
                'photo_url'     => $row['photo_url'] ?: null,
                'is_active'     => true,
                'source'        => 'csv',
                'last_login_at' => now(),
            ]
        );

        // Create a STATEFUL session (no personal access token)
        Auth::login($user, true);
        $req->session()->regenerate();

        return response()->json([
            'message' => 'Login successful',
            'user'    => [
                'id'         => $user->id,
                'email'      => $user->email,
                'name'       => $user->name,
                'role'       => $user->role,
                'dept'       => $user->dept,
                'account_no' => $user->account_no,
                'photo_url'  => $user->photo_url,
            ],
        ]);
    }

    public function me(Request $req)
    {
        return response()->json($req->user());
    }

    public function logout(Request $req)
    {
        // End the session properly
        Auth::guard('web')->logout();
        $req->session()->invalidate();
        $req->session()->regenerateToken();
        return response()->json(['message' => 'Logged out']);
    }

    // Optional: admin endpoint to reload CSV cache
    public function reloadCsv()
    {
        Cache::forget('csv_auth_users_v1');
        return response()->json(['message' => 'CSV cache cleared']);
    }
}
