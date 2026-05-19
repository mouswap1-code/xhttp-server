const os = require('os');
const http = require('http');
const net = require('net');
const { execSync } = require('child_process');

// Vérifier ws
try { require.resolve('ws'); } catch(e) { execSync('npm install ws', { stdio: 'inherit' }); }
const { WebSocket, createWebSocketStream } = require('ws');

// Configuration basée sur ton lien VLESS
const NAME = process.env.NAME || os.hostname();
const UUID = 'f09a960a-4f1b-495f-9962-f1a14e5a7791';
const PORT = process.env.PORT || 8080;
const DOMAIN = 'main-bvxea6i-gzlonww5dskks.fr-3.platformsh.site';

// Paramètres XHTTP (depuis ton lien)
const XHTTP_MODE = 'auto';
const XHTTP_PATH = '/';
const XHTTP_PADDING = '100-1000';

console.log("==========================================");
console.log("Serveur VLESS XHTTP - Upsun");
console.log("UUID:", UUID);
console.log("Domaine:", DOMAIN);
console.log("Port interne:", PORT);
console.log("Mode XHTTP:", XHTTP_MODE);
console.log("Padding:", XHTTP_PADDING);
console.log("==========================================");

const httpServer = http.createServer((req, res) => {
    const url = req.url;
    
    // Page d'accueil
    if (url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Serveur XHTTP OK\n');
        return;
    }
    
    // Générer le lien VLESS (exactement comme ton lien, mais avec domaine Upsun)
    if (url === `/${UUID}`) {
        const vlessURL = `vless://${UUID}@${DOMAIN}:443?type=xhttp&encryption=none&path=${XHTTP_PATH}&host=${DOMAIN}&mode=${XHTTP_MODE}&x_padding_bytes=${XHTTP_PADDING}&extra=%7B%22xPaddingBytes%22%3A%22${XHTTP_PADDING}%22%7D&security=tls#XHTTP-${NAME}`;
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(vlessURL + '\n');
        return;
    }
    
    // Requête XHTTP POST
    if (req.method === 'POST') {
        let body = [];
        req.on('data', chunk => body.push(chunk));
        req.on('end', () => {
            res.writeHead(200, {
                'Content-Type': 'application/octet-stream',
                'Cache-Control': 'no-store',
                'X-Accel-Buffering': 'no',
                'Access-Control-Allow-Origin': '*'
            });
            res.end();
        });
        return;
    }
    
    // Requête XHTTP GET (streaming descendant)
    if (req.method === 'GET') {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-store',
            'X-Accel-Buffering': 'no',
            'Access-Control-Allow-Origin': '*'
        });
        req.socket.setTimeout(0);
        return;
    }
    
    res.writeHead(404);
    res.end('Not Found\n');
});

// Démarrer le serveur
httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Serveur XHTTP démarré sur le port ${PORT}`);
    console.log(`Lien VLESS: vless://${UUID}@${DOMAIN}:443?type=xhttp&encryption=none&path=${XHTTP_PATH}&host=${DOMAIN}&mode=${XHTTP_MODE}&x_padding_bytes=${XHTTP_PADDING}&security=tls`);
});

// Support WebSocket pour compatibilité
const wss = new WebSocket.Server({ server: httpServer });
const uuidHex = UUID.replace(/-/g, "");

wss.on('connection', (ws) => {
    ws.on('message', (msg) => {
        try {
            const VERSION = msg[0];
            const id = msg.slice(1, 17);
            
            // Vérification UUID
            for (let i = 0; i < 16; i++) {
                if (id[i] !== parseInt(uuidHex.substr(i * 2, 2), 16)) {
                    ws.close();
                    return;
                }
            }
            
            let i = msg[17] + 19;
            const port = msg.readUInt16BE(i);
            i += 2;
            const ATYP = msg[i++];
            
            let host;
            if (ATYP === 1) {
                host = msg.slice(i, i + 4).join('.');
                i += 4;
            } else if (ATYP === 2) {
                const len = msg[i++];
                host = msg.slice(i, i + len).toString();
                i += len;
            } else if (ATYP === 3) {
                host = msg.slice(i, i + 16).reduce((acc, b, idx) => {
                    if (idx % 2 === 0) acc.push(msg.readUInt16BE(i + idx));
                    return acc;
                }, []).map(p => p.toString(16)).join(':');
                i += 16;
            } else {
                ws.close();
                return;
            }
            
            ws.send(new Uint8Array([VERSION, 0]));
            const duplex = createWebSocketStream(ws);
            const socket = net.connect({ host, port }, () => {
                if (msg.slice(i)) socket.write(msg.slice(i));
                duplex.pipe(socket).pipe(duplex);
            });
            socket.on('error', () => duplex.destroy());
            duplex.on('error', () => socket.destroy());
        } catch (err) {
            ws.close();
        }
    });
});

console.log("Serveur prêt - XHTTP mode " + XHTTP_MODE);
