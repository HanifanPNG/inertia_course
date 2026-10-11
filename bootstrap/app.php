<?php

use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\RoleMiddleware;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        // Di produksi, Caddy meng-terminate TLS lalu meneruskan HTTP ke
        // container nginx, yang ada di 127.0.0.1:8000. Akibatnya PHP melihat
        // request sebagai http sementara browser memakai https, sehingga url()
        // menghasilkan http:// dan aset Vite diblokir Mixed Content.
        // TRUST_PROXIES=true membuat Laravel mempercayai X-Forwarded-Proto
        // dari Caddy. Tanpa reverse proxy, biarkan kosong.
        //
        // Nilai dibaca dari $_SERVER, bukan env() atau config(), karena config
        // belum ter-resolve pada saat middleware ini didaftarkan, dan file
        // .env tidak dimuat ketika config:cache aktif.
        if (filter_var($_SERVER['TRUST_PROXIES'] ?? false, FILTER_VALIDATE_BOOLEAN)) {
            $middleware->trustProxies(at: '*');
        }

        $middleware->alias([
            'role' => RoleMiddleware::class,
        ]);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
