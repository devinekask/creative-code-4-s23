const express = require('express')
const app = express()
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const port = 3000

app.use(express.static('public'))
server.listen(port, () => {
  console.log(`App listening on port ${port}`)
})

io.on('connection', socket => {
  console.log(`Connection`);
  socket.on(`message`, message => {
    console.log(`Received message: ${message}`);
    io.sockets.emit(`message`, message);
  });
});