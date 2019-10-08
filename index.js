const express = require('express');
const app = express();
const WebSocket = require('ws');
const http = require('http');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

app.use(express.static(path.resolve(`${__dirname}/../n001-frontend/build/`)));

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
    return value;
  }
};

app.post('/api', upload.single('photo'), (req, res) => {
  const filePath = store.set(
    'lastImage',
    path.resolve(`${__dirname}/uploads/${req.file.filename}`)
  );

  store.set('age', store.get('age') + parseInt(req.body.age));

  wss.clients.forEach(client =>
    client.send(
      JSON.stringify({
        lastImage: store.get('lastImage'),
        age: store.get('age')
      })
    )
  );
  res.send('OK');
});

app.get('/api/images/', (req, res) => {
  const filePath = path.resolve(
    `${__dirname}/uploads/${store.get('lastImage')}`
  );
  console.log(filePath);
  res.sendFile(filePath);
});

app.get('/api/numpeople/', (req, res) => {
  console.log(req.query.num);
  store.set('numPeople', req.query.num);
  wss.clients.forEach(client => {
    client.send(req.params.num);
  });
});

server.listen(80, () => console.log('listening…'));
