<?php
// Duitin - Laravel Herd Bridge & Reverse Proxy
// Memastikan Duitin dapat dibuka langsung dari Laravel Herd (http://duitin.test)

$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);

function isBackendAlive(string $host = '127.0.0.1', int $port = 8080, float $timeout = 0.2): bool {
    $fp = @fsockopen($host, $port, $errno, $errstr, $timeout);
    if (is_resource($fp)) {
        fclose($fp);
        return true;
    }
    return false;
}

function ensureBackendRunning(): void {
    if (isBackendAlive()) {
        return;
    }

    $backendDir = __DIR__ . '/backend';
    $exe = $backendDir . '/target/debug/duitin-backend.exe';
    if (!file_exists($exe)) {
        $exe = $backendDir . '/target/release/duitin-backend.exe';
    }

    if (file_exists($exe)) {
        $backendDirWin = str_replace('/', '\\', $backendDir);
        $exeWin = str_replace('/', '\\', $exe);
        $cmd = "start \"\" /D \"$backendDirWin\" /B \"$exeWin\"";
        pclose(popen($cmd, 'r'));

        // Tunggu maksimal 2 detik sampai port 8080 merespons
        for ($i = 0; $i < 10; $i++) {
            usleep(200000); // 200ms
            if (isBackendAlive()) {
                break;
            }
        }
    }
}

// 1. Proxy REST API (/api/v1/...) ke backend Rust Axum (127.0.0.1:8080)
if (str_starts_with($uri, '/api/')) {
    ensureBackendRunning();

    if (!isBackendAlive()) {
        http_response_code(503);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'error' => 'Backend Rust (Axum) belum berjalan di port 8080. Menjalankan duitin-backend.exe...'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $targetUrl = 'http://127.0.0.1:8080' . ($_SERVER['REQUEST_URI'] ?? $uri);
    $ch = curl_init($targetUrl);

    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HEADER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);

    // Forward request headers
    $forwardHeaders = [];
    $allHeaders = function_exists('getallheaders') ? getallheaders() : [];
    foreach ($allHeaders as $name => $value) {
        $lower = strtolower($name);
        if (in_array($lower, ['host', 'content-length', 'connection'], true)) {
            continue;
        }
        $forwardHeaders[] = "$name: $value";
    }

    // Forward request payload
    if (!in_array($method, ['GET', 'HEAD', 'OPTIONS'], true)) {
        $body = file_get_contents('php://input');
        curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    }

    if (!empty($forwardHeaders)) {
        curl_setopt($ch, CURLOPT_HTTPHEADER, $forwardHeaders);
    }

    $response = curl_exec($ch);

    if ($response === false) {
        http_response_code(502);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['error' => 'Proxy error: ' . curl_error($ch)]);
        curl_close($ch);
        exit;
    }

    $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $rawHeaders = substr($response, 0, $headerSize);
    $responseBody = substr($response, $headerSize);

    http_response_code($httpCode);

    foreach (explode("\r\n", $rawHeaders) as $headerLine) {
        $lower = strtolower($headerLine);
        if (empty($headerLine) || str_starts_with($lower, 'transfer-encoding:') || str_starts_with($lower, 'http/')) {
            continue;
        }
        header($headerLine, false);
    }

    echo $responseBody;
    exit;
}

// 2. Cek apakah Vite Dev Server sedang berjalan di port 5173
$vitePortActive = false;
$fp = @fsockopen('127.0.0.1', 5173, $errno, $errstr, 0.2);
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
    // Jalankan backend di background jika belum aktif agar siap saat UI memanggil API
    ensureBackendRunning();

    $filePath = $distPath . $uri;

    if ($uri !== '/' && file_exists($filePath) && !is_dir($filePath)) {
        $ext = pathinfo($filePath, PATHINFO_EXTENSION);
        $mimes = [
            'css'  => 'text/css; charset=utf-8',
            'js'   => 'application/javascript; charset=utf-8',
            'svg'  => 'image/svg+xml',
            'png'  => 'image/png',
            'jpg'  => 'image/jpeg',
            'ico'  => 'image/x-icon',
            'json' => 'application/json',
        ];
        $contentType = $mimes[$ext] ?? mime_content_type($filePath) ?: 'application/octet-stream';
        header("Content-Type: $contentType");
        readfile($filePath);
        exit;
    }

    // SPA Fallback
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
