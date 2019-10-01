const app = require('express')();
const WebSocket = require('ws');
const http = require('http');
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const storage = multer.diskStorage({
  destination: `${__dirname}/uploads/`,
  filename: function(req, file, cb) {
    cb(
      null,
      `photoweek-${Date.now()}.${file.mimetype === 'image/png' ? 'png' : 'jpg'}`
    );
  }
});
const upload = multer({ storage });

const server = http.createServer(app);

const wss = new WebSocket.Server({ server });

const store = {
  age: 0,
  numPeople: 0,
  lastImage: '',
  get: function(key) {
    return this[key];
  },
  set: function(key, value) {
    this[key] = value;
  }
};

app.post('/api', upload.single('photo'), (req, res) => {
  store.set('lastImage', req.file.filename);
  console.log(store);
  const filePath = path.resolve(
    `${__dirname}/uploads/${store.get('lastImage')}`
  );
  wss.clients.forEach(client => {
    client.send(filePath);
  });
});

app.get('/api/images/', (req, res) => {
  const filePath = path.resolve(
    `${__dirname}/uploads/${store.get('lastImage')}`
  );
  console.log(filePath);
  res.sendFile(filePath);
});

app.get('/api/age', (req, res) => {});

app.post('/api/numpeople/:num', (req, res) => {
  store.set('numPeople', req.params.num);
  wss.clients.forEach(client => {
    client.send(req.params.num);
  });
});

server.listen(3001, () => console.log('listening…'));
