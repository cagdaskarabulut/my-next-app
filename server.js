const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const users = {};

io.on("connection", (socket) => {
  socket.on("join-room", () => {
    users[socket.id] = socket.id;

    // Mevcut kullanıcıları gönder
    const usersInRoom = Object.keys(users).filter((id) => id !== socket.id);
    socket.emit("all-users", usersInRoom);

    // Diğer kullanıcılara yeni kullanıcıyı bildir
    socket.broadcast.emit("user-joined", { peerId: socket.id });
  });

  socket.on("sending-signal", (payload) => {
    io.to(payload.userToSignal).emit("receiving-signal", {
      signal: payload.signal,
      id: payload.callerID,
    });
  });

  socket.on("disconnect", () => {
    delete users[socket.id];
  });
});

server.listen(3001, () => {
  console.log("Sunucu 3001 portunda çalışıyor");
});
