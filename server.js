const http = require('http');

// === CONFIGURATION ===
const VPS_HOST = '188.213.28.174';                      // IP de ton VPS
const VPS_PORT = 80;                                    // Port HTTP du VPS
const UUID = 'b40c163d-e7bc-44e0-8d29-669f7826d9c9';    // Ton UUID
const XHTTP_PATH = '/';
const XHTTP_MODE = 'auto';
const XHTTP_PADDING = '100-1000';
const HOST_HEADER = 'ultrategateworld.benbilal237free.xyz';
const PORT = process.env.PORT || 8080;
const FP = 'chrome';
const ALPN = ['h2', 'http/1.1'];

// Domaine Cloud Run (ou Upsun)
const DOMAIN = process.env.DOMAIN || 'main-bvxea6i-gzlonww5dskks.fr-3.platformsh.site';

// === GÉNÉRATEUR DE LIEN VLESS ===
function generateVlessLink(host) {
    const extraObj = {
        mode: XHTTP_MODE,
        scMaxEachPostBytes: "1000000",
        xPaddingBytes: XHTTP_PADDING
    };
    const extraEncoded = encodeURIComponent(JSON.stringify(extraObj));
    
    return `vless://${UUID}@${host}:${VPS_PORT}?encryption=none&type=xhttp&path=${encodeURIComponent(XHTTP_PATH)}&host=${HOST_HEADER}&mode=${XHTTP_MODE}&x_padding_bytes=${XHTTP_PADDING}&extra=${extraEncoded}&fp=${FP}&alpn=${ALPN.join('%2C')}#XHTTP-Bridge`;
}

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║         🚀 XHTTP Bridge - VPS Proxy                         ║');
console.log('╠══════════════════════════════════════════════════════════════╣');
console.log(`║ 📡 VPS cible:     ${VPS_HOST}:${VPS_PORT}`);
console.log(`║ 🔑 UUID:          ${UUID}`);
console.log(`║ 🎯 Host Header:   ${HOST_HEADER}`);
console.log(`║ 🌐 Domaine:       ${DOMAIN}`);
console.log(`║ 📦 Type:          XHTTP (mode ${XHTTP_MODE})`);
console.log(`║ 🧩 Padding:       ${XHTTP_PADDING}`);
console.log('╚══════════════════════════════════════════════════════════════╝');

const server = http.createServer((req, res) => {
    const url = req.url;
    const now = new Date().toISOString();
    
    // Health check
    if (url === '/health' || url === '/healthz') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            status: 'ok', 
            service: 'xhttp-bridge',
            vps: VPS_HOST,
            timestamp: now
        }));
        console.log(`[${now}] ✅ Health check`);
        return;
    }
    
    // Page d'accueil
    if (url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>XHTTP Bridge</title>
                <style>
                    body { font-family: monospace; padding: 2rem; max-width: 800px; margin: 0 auto; }
                    .success { color: green; }
                    .info { color: blue; }
                </style>
            </head>
            <body>
                <h1>🚀 XHTTP Bridge</h1>
                <p class="success">✅ Bridge actif vers VPS</p>
                <p>📡 VPS cible: <strong>${VPS_HOST}:${VPS_PORT}</strong></p>
                <p>🔑 UUID configuré: <strong>${UUID.substring(0, 8)}...${UUID.substring(UUID.length - 8)}</strong></p>
                <hr>
                <h2>📱 Liens VLESS :</h2>
                <ul>
                    <li><a href="/${UUID}">Configuration principale</a></li>
                    <li><a href="/config">Configuration alternative</a></li>
                    <li><a href="/${VPS_HOST}">🔥 Lien avec IP du VPS</a></li>
                </ul>
            </body>
            </html>
        `);
        console.log(`[${now}] 📄 Page d'accueil affichée`);
        return;
    }
    
    // ✅ ROUTE POUR IP (ex: /188.213.28.174)
    const ipMatch = url.match(/^\/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
    if (ipMatch) {
        const ip = ipMatch[1];
        const vlessLink = generateVlessLink(ip);
        res.writeHead(200, { 
            'Content-Type': 'text/plain',
            'Access-Control-Allow-Origin': '*'
        });
        res.end(vlessLink + '\n');
        console.log(`[${now}] 🔗 Lien VLESS généré pour IP: ${ip}`);
        return;
    }
    
    // Route UUID et /config
    if (url === `/${UUID}` || url === '/config') {
        const vlessLink = generateVlessLink(VPS_HOST);
        res.writeHead(200, { 
            'Content-Type': 'text/plain',
            'Access-Control-Allow-Origin': '*'
        });
        res.end(vlessLink + '\n');
        console.log(`[${now}] 🔗 Lien VLESS généré (${url})`);
        return;
    }
    
    // === PROXY XHTTP VERS LE VPS ===
    console.log(`[${now}] 🔄 Proxy: ${req.method} ${url} → ${VPS_HOST}:${VPS_PORT}`);
    
    const options = {
        hostname: VPS_HOST,
        port: VPS_PORT,
        path: url,
        method: req.method,
        headers: {
            ...req.headers,
            'host': HOST_HEADER,
            'user-agent': req.headers['user-agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'accept-encoding': 'gzip, deflate',
            'connection': 'keep-alive',
            'x-padding-bytes': XHTTP_PADDING,
            'x-request-id': Date.now().toString()
        },
        timeout: 30000,
        rejectUnauthorized: false
    };
    
    const proxyReq = http.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, {
            ...proxyRes.headers,
            'x-proxied-by': 'XHTTP-Bridge'
        });
        proxyRes.pipe(res);
        console.log(`[${now}] ✅ Réponse: ${proxyRes.statusCode} pour ${url}`);
    });
    
    proxyReq.on('error', (err) => {
        console.error(`[${now}] ❌ Erreur proxy VPS: ${err.message}`);
        res.writeHead(502, { 
            'Content-Type': 'text/plain',
            'x-error': err.message
        });
        res.end(`Bad Gateway: Cannot reach VPS ${VPS_HOST}:${VPS_PORT}\nErreur: ${err.message}\n`);
    });
    
    proxyReq.on('timeout', () => {
        console.error(`[${now}] ⏰ Timeout sur ${url}`);
        proxyReq.destroy();
        res.writeHead(504, { 'Content-Type': 'text/plain' });
        res.end('Gateway Timeout\n');
    });
    
    req.pipe(proxyReq);
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n✅ Bridge XHTTP démarré sur le port ${PORT}`);
    console.log(`\n📱 LIENS VLESS :`);
    console.log(`   ➜ https://${DOMAIN}/config`);
    console.log(`   ➜ https://${DOMAIN}/${UUID}`);
    console.log(`   ➜ https://${DOMAIN}/${VPS_HOST} (IP uniquement)\n`);
});

server.on('error', (err) => {
    console.error(`❌ Erreur serveur: ${err.message}`);
});

process.on('SIGTERM', () => {
    console.log('🛑 Arrêt du serveur...');
    server.close(() => process.exit(0));
});
