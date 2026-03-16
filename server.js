const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // 같은 네트워크의 다른 기기에서 접속 가능

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

const server = http.createServer((req, res) => {
  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = path.join(__dirname, filePath);

  const ext = path.extname(filePath);
  const contentType = MIME[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not Found');
        return;
      }
      res.writeHead(500);
      res.end('Server Error');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, HOST, () => {
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  let localUrl = `http://localhost:${PORT}`;
  let networkUrls = [];

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        networkUrls.push(`http://${net.address}:${PORT}`);
      }
    }
  }

  console.log('\n  벽돌깨기 게임 서버가 실행 중입니다.\n');
  console.log('  본인 접속:     ', localUrl);
  if (networkUrls.length > 0) {
    console.log('  다른 사람 접속 (같은 WiFi):');
    networkUrls.forEach((url) => console.log('    ', url));
    console.log('\n  위 주소를 친구에게 공유하면 같은 네트워크에서 게임할 수 있습니다.\n');
  } else {
    console.log('  같은 네트워크 접속: 이 PC의 IP 주소와 포트', PORT, '로 접속하세요.\n');
  }
});
