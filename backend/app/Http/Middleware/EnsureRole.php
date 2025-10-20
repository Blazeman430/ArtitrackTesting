<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureRole
{
    /**
     * Usage:
     *   ->middleware('role:custodian,admin')
     *   ->middleware('role:lab_faci:HTM')  // role + dept match
     *
     * Param format:
     *   role[:DEPT][,role2[:DEPT2]...]
     */
    public function handle(Request $request, Closure $next, ...$params)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $role = strtolower($user->role ?? $user->type ?? '');
        $dept = strtoupper($user->dept ?? '');

        // Accept multiple allowed entries like: "custodian", "admin", "lab_faci:HTM"
        foreach ($params as $p) {
            [$needRole, $needDept] = array_pad(explode(':', $p, 2), 2, null);
            $needRole = strtolower($needRole);
            $needDept = $needDept ? strtoupper($needDept) : null;

            if ($role === $needRole && (!$needDept || $dept === $needDept)) {
                return $next($request);
            }
            // allow “admin” everywhere
            if ($role === 'admin') {
                return $next($request);
            }
        }

        return response()->json(['message' => 'Forbidden'], 403);
    }
}
