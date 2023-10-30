const net = require('net');
const http = require('http');
const url = require('url');

const proxyServer = http.createServer(httpOptions);

function httpOptions(clientReq, clientRes) {
  const reqUrl = url.parse(clientReq.url);
  const options = {
    hostname: reqUrl.hostname,
    port: reqUrl.port,
    path: reqUrl.path,
    method: clientReq.method,
    headers: clientReq.headers
  };

  const serverConnection = http.request(options, function (res) {
    clientRes.writeHead(res.statusCode, res.headers);
    res.pipe(clientRes);
  });

  clientReq.pipe(serverConnection);

  clientReq.on('error', (e) => {
    console.log('client socket error: ' + e);
  });

  serverConnection.on('error', (e) => {
    console.log('server connection error: ' + e);
  });
}

proxyServer.on('connect', (clientReq, clientSocket, head) => {
  const reqUrl = url.parse('https://' + clientReq.url);
  const options = {
    port: reqUrl.port,
    host: reqUrl.hostname
  };

  const serverSocket = net.connect(options, () => {
    clientSocket.write('HTTP/' + clientReq.httpVersion + ' 200 Connection Established\r\n' +
      'Proxy-agent: Node.js-Proxy\r\n' +
      '\r\n', 'UTF-8', () => {
        serverSocket.write(head);
        serverSocket.pipe(clientSocket);
        clientSocket.pipe(serverSocket);
      });
  });

  clientSocket.on('error', (e) => {
    console.log("client socket error: " + e);
    serverSocket.end();
  });

  serverSocket.on('error', (e) => {
    console.log("forward proxy server connection error: " + e);
    clientSocket.end();
  });
});

proxyServer.on('clientError', (err, clientSocket) => {
  console.log('client error: ' + err);
  clientSocket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});

proxyServer.listen(2560, () => {
  console.log('forward proxy server started, listening on port 2560');
});
