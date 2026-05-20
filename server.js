const http = require('http');
const https = require('https');

// === Configuration basée sur ton lien VLESS ===
const VPS_HOST = '188.213.28.174';      // IP de ton VPS
const VPS_PORT = 80;                    // Port de ton VPS
const UUID = 'f09a960a-4f1b-495f-9962-f1a14e5a7791';
const PORT = process.env.PORT || 8080;

// Paramètres XHTTP
const XHTTP_MODE = 'auto';
const XHTTP_PATH = '/';
const XHTTP_PADDING = '100-1000';

// Domaine Upsun
const DOMAIN = process.env.DOMAIN || 'main-bvxea6i-gzlonww5dskks.fr-3.platformsh.site';

console.log('==========================================');
console.log('🚀 Bridge XHTTP - Upsun → VPS');
console.log(`📡 VPS cible: ${VPS_HOST}:${VPS_PORT}`);
console.log(`🔑 UUID: ${UUID}`);
console.log(`🌐 Domaine Upsun: ${DOMAIN}`);
console.log('==========================================');

const server = http.createServer((req, res) => {
    const url = req.url;
    
    // === 1. Générer le lien VLESS pour les clients ===
    if (url === `/${UUID}`) {
        const vlessLink = `vless://${UUID}@${DOMAIN}:443?type=xhttp&encryption=none&path=${XHTTP_PATH}&host=${DOMAIN}&mode=${XHTTP_MODE}&x_padding_bytes=${XHTTP_PADDING}&extra=%7B%22xPaddingBytes%22%3A%22${XHTTP_PADDING}%22%7D&security=tls#XHTTP-Bridge-Upsun`;
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(vlessLink + '\n');
        return;
    }
    
    // === 2. Proxy XHTTP vers le VPS ===
    const httpModule = (VPS_PORT === 443) ? https : http;
    
    const options = {
        hostname: VPS_HOST,
        port: VPS_PORT,
        path: url,
        method: req.method,
        headers: {
            ...req.headers,
            'host': req.headers.host || VPS_HOST,
            'x-padding-bytes': XHTTP_PADDING,
            'connection': 'keep-alive'
        },
        rejectUnauthorized: false
    };
    
    const proxyReq = httpModule.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
    });
    
    proxyReq.on('error', (err) => {
        console.error(`❌ Erreur VPS: ${err.message}`);
        res.writeHead(502);
        res.end('Bad Gateway: VPS inaccessible\n');
    });
    
    req.pipe(proxyReq);
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Bridge XHTTP actif sur le port ${PORT}`);
    console.log(`🔗 Lien VLESS: vless://${UUID}@${DOMAIN}:443?type=xhttp&encryption=none&path=${XHTTP_PATH}&host=${DOMAIN}&mode=${XHTTP_MODE}&x_padding_bytes=${XHTTP_PADDING}&security=tls#XHTTP-Bridge-Upsun`);
});
