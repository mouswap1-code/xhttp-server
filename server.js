const http = require('http');
const https = require('https');

// === Configuration ===
const VPS_HOST = '188.213.28.174';      // IP de ton VPS
const VPS_PORT = 80;                    // Port XHTTP du VPS
const UUID = 'f09a960a-4f1b-495f-9962-f1a14e5a7791';
const PORT = process.env.PORT || 8080;
const XHTTP_PATH = '/';

// L'adresse finale dans le lien VLESS (l'IP du VPS)
const VLESS_ADDRESS = '188.213.28.174';

console.log('==========================================');
console.log('🚀 Bridge XHTTP - Upsun → VPS');
console.log(`📡 VPS cible: ${VPS_HOST}:${VPS_PORT}`);
console.log(`🔑 UUID: ${UUID}`);
console.log(`🌐 Adresse VLESS: ${VLESS_ADDRESS}`);
console.log('==========================================');

const server = http.createServer((req, res) => {
    const url = req.url;
    
    // Générer le lien VLESS (pointe directement vers l'IP du VPS)
    if (url === `/${UUID}`) {
        const vlessLink = `vless://${UUID}@${VLESS_ADDRESS}:443?type=xhttp&encryption=none&path=${XHTTP_PATH}&host=&mode=auto&x_padding_bytes=100-1000&extra=%7B%22xPaddingBytes%22%3A%22100-1000%22%7D&security=tls#XHTTP-VPS-Direct`;
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(vlessLink + '\n');
        console.log(`🔗 Lien généré: ${vlessLink}`);
        return;
    }
    
    // Proxy XHTTP vers le VPS
    const options = {
        hostname: VPS_HOST,
        port: VPS_PORT,
        path: url,
        method: req.method,
        headers: {
            ...req.headers,
            'host': req.headers.host || VPS_HOST
        }
    };
    
    const proxyReq = http.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
    });
    
    proxyReq.on('error', (err) => {
        console.error(`❌ Erreur: ${err.message}`);
        res.writeHead(502);
        res.end('Bad Gateway');
    });
    
    req.pipe(proxyReq);
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Bridge actif sur le port ${PORT}`);
    console.log(`🔗 Pour obtenir le lien VLESS, accède à: https://${process.env.DOMAIN || 'main-bvxea6i-gzlonww5dskks.fr-3.platformsh.site'}/${UUID}`);
});
