<?php

/**
 * Di produksi Caddy meng-terminate TLS lalu meneruskan HTTP ke container
 * nginx. Tanpa mempercayai X-Forwarded-Proto dari Caddy, url() menghasilkan
 * http:// sehingga browser memblokir aset Vite sebagai Mixed Content.
 *
 * @see bootstrap/app.php
 */
it('tidak mempercayai proxy secara default', function () {
    $this->get('/up', headers: ['X-Forwarded-Proto' => 'https']);

    expect(url('/'))->toStartWith('http://');
});

it('mempercayai proxy saat TRUST_PROXIES aktif', function () {
    $_SERVER['TRUST_PROXIES'] = 'true';
    $this->refreshApplication();

    $this->get('/up', headers: ['X-Forwarded-Proto' => 'https']);

    expect(url('/'))->toStartWith('https://');

    unset($_SERVER['TRUST_PROXIES']);
});

it('halaman login tetap dapat diakses', function () {
    $this->get('/login')->assertOk();
});
