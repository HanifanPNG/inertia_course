@php
    $money = fn (float $amount): string => 'Rp '.number_format($amount, 0, ',', '.');
@endphp
<!DOCTYPE html>
<html lang="id">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Struk #{{ $order['order_number'] }} — {{ $storeName }}</title>
        <style>
            @page {
                size: 80mm auto;
                margin: 0;
            }

            :root {
                --ink: #000;
                --rule: #000;
            }

            @font-face {
                font-family: 'Playwrite AR';
                src: url('/fonts/playwrite-ar-400.woff2') format('woff2');
                font-weight: 400;
                font-style: normal;
                font-display: swap;
            }

            * {
                box-sizing: border-box;
            }

            body {
                margin: 0;
                background: #d9d4c9;
                color: var(--ink);
                font-family: ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
                font-size: 12px;
                line-height: 1.45;
            }

            .toolbar {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                justify-content: center;
                padding: 16px;
                font-family: system-ui, sans-serif;
            }

            .toolbar button {
                border: 1px solid var(--ink);
                background: #fff;
                color: var(--ink);
                cursor: pointer;
                font: inherit;
                padding: 8px 16px;
            }

            .toolbar button.primary {
                background: var(--ink);
                color: #fff;
            }

            .struk {
                background: #fff;
                margin: 0 auto 16px;
                padding: 6mm 5mm;
                width: 80mm;
            }

            .store {
                font-family: 'Playwrite AR', 'Segoe Script', cursive;
                font-size: 20px;
                line-height: 1.25;
                text-align: center;
            }

            .kind {
                margin-top: 2px;
                text-align: center;
            }

            .rule {
                border-top: 1px dashed var(--rule);
                margin: 8px 0;
            }

            .line {
                display: flex;
                justify-content: space-between;
                gap: 8px;
            }

            .line span:last-child {
                text-align: right;
            }

            table {
                border-collapse: collapse;
                width: 100%;
            }

            th {
                border-bottom: 1px solid var(--rule);
                font-weight: 400;
                padding-bottom: 2px;
                text-align: left;
            }

            th.right,
            td.right {
                text-align: right;
                white-space: nowrap;
            }

            td {
                padding-bottom: 2px;
                vertical-align: top;
            }

            td.qty {
                white-space: nowrap;
                width: 12mm;
            }

            tr.total td {
                font-size: 14px;
                font-weight: 700;
                padding-top: 4px;
            }

            .foot {
                margin-top: 10px;
                text-align: center;
            }

            @media print {
                body {
                    background: #fff;
                }

                .toolbar {
                    display: none;
                }

                .struk {
                    margin: 0;
                    padding: 4mm 5mm;
                    width: auto;
                }
            }
        </style>
    </head>

    <body>
        <div class="toolbar">
            <button type="button" class="primary" onclick="window.print()">
                Cetak struk
            </button>
            <button type="button" onclick="window.close()">Tutup</button>
        </div>

        <main class="struk">
            <p class="store">{{ $storeName }}</p>
            <p class="kind">Struk pembayaran</p>

            <div class="rule"></div>

            <div class="line">
                <span>No. pesanan</span>
                <span>#{{ $order['order_number'] }}</span>
            </div>
            <div class="line">
                <span>Tanggal</span>
                <span>{{ $order['date'] }} {{ $order['time'] }}</span>
            </div>
            <div class="line">
                <span>Kasir</span>
                <span>{{ $order['cashier'] }}</span>
            </div>
            @if ($order['client_name'] !== '')
                <div class="line">
                    <span>Pelanggan</span>
                    <span>{{ $order['client_name'] }}</span>
                </div>
            @endif

            <div class="rule"></div>

            <table>
                <thead>
                    <tr>
                        <th class="qty">Qty</th>
                        <th>Menu</th>
                        <th class="right">Jumlah</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($order['items'] as $item)
                        <tr>
                            <td class="qty">{{ $item['quantity'] }}</td>
                            <td>
                                {{ $item['product_name'] }}
                                <br />
                                <span>@ {{ $money((float) $item['price']) }}</span>
                            </td>
                            <td class="right">
                                {{ $money((float) $item['subtotal']) }}
                            </td>
                        </tr>
                    @endforeach
                    <tr class="total">
                        <td colspan="2">TOTAL</td>
                        <td class="right">
                            {{ $money($order['total_amount']) }}
                        </td>
                    </tr>
                </tbody>
            </table>

            <div class="rule"></div>

            <div class="line">
                <span>Bayar ({{ $order['payment']['method'] }})</span>
                <span>{{ $money($order['payment']['amount']) }}</span>
            </div>
            <div class="line">
                <span>Kembali</span>
                <span>{{ $money($order['payment']['change']) }}</span>
            </div>
            @if ($order['payment']['paid_at'] !== null)
                <div class="line">
                    <span>Dibayar</span>
                    <span>{{ $order['payment']['paid_at'] }}</span>
                </div>
            @endif

            <div class="rule"></div>

            <p class="foot">
                Dicetak {{ $printedAt }}<br />
                Terima kasih, selamat Makan!
            </p>
        </main>

        <script>
            window.addEventListener('load', function () {
                window.print();
            });
        </script>
    </body>
</html>