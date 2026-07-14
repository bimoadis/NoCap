const http = require('http');

const data = JSON.stringify({
  txHash: "0xmock_payment_hash_12345",
  chainId: "4663",
  address: "0x482b0Ce8f55e6c9A0e66c466303aA87F52E4600d",
  userWallet: "5tkE4DnF7vbBq5uhVbJDZCXzmSgddKEBRu6omsrbzuSu"
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/v1/agent/checkout',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('STATUS CODE:', res.statusCode);
    console.log('RESPONSE:', JSON.stringify(JSON.parse(body), null, 2));
  });
});

req.on('error', (error) => {
  console.error('Error fetching API:', error);
});

req.write(data);
req.end();
