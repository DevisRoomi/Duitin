<?php
// Duitin - Laravel Herd Bridge & Proxy
// Memastikan Duitin dapat dibuka langsung dari Laravel Herd (http://duitin.test)

$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);

// 1. Jika memanggil REST API backend (/api/v1/...)
if (str_starts_with($uri, '/api/')) {
    $backendUrl = 'http://127.0.0.1:8080' . $_SERVER['REQUEST_URI'];
    header("Location: $backendUrl");
    exit;
}

// 2. Cek apakah Vite Dev Server sedang berjalan di port 5173
$vitePortActive = false;
$fp = @fsockopen('127.0.0.1', 5173, $errno, $errstr, 0.3);
if (is_resource($fp)) {
    fclose($fp);
    $vitePortActive = true;
}

if ($vitePortActive) {
    header('Location: http://localhost:5173' . $_SERVER['REQUEST_URI']);
    exit;
}

// 3. Jika Vite dev server tidak aktif, sajikan build produksi React dari frontend/dist
$distPath = __DIR__ . '/frontend/dist';
if (file_exists($distPath . '/index.html')) {
    $filePath = $distPath . $uri;

    if ($uri !== '/' && file_exists($filePath) && !is_dir($filePath)) {
        $ext = pathinfo($filePath, PATHINFO_EXTENSION);
        $mimes = [
            'css' => 'text/css; charset=utf-8',
            'js'  => 'application/javascript; charset=utf-8',
            'svg' => 'image/svg+xml',
            'png' => 'image/png',
            'jpg' => 'image/jpeg',
            'ico' => 'image/x-icon',
            'json'=> 'application/json',
        ];
        $contentType = $mimes[$ext] ?? mime_content_type($filePath) ?: 'application/octet-stream';
        header("Content-Type: $contentType");
        readfile($filePath);
        exit;
    }

    header('Content-Type: text/html; charset=utf-8');
    readfile($distPath . '/index.html');
    exit;
}

// 4. Fallback jika belum di-build
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Duitin - Finance Tracker</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0f172a; color: #ffffff; text-align: center; }
        .card { background: #1e293b; padding: 2rem; border-radius: 12px; max-width: 480px; border: 1px solid #334155; }
        a { color: #38bdf8; text-decoration: none; font-weight: bold; }
    </style>
</head>
<body>
    <div class="card">
        <h2>Duitin di Laravel Herd</h2>
        <p>Aplikasi full-stack Duitin terhubung di <code>http://duitin.test</code>.</p>
        <p>Silakan jalankan backend dan frontend dengan mengklik file <code>run_local.bat</code> atau kunjungi langsung <a href="http://localhost:5173">http://localhost:5173</a>.</p>
    </div>
</body>
</html>
