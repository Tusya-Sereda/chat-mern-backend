require("dotenv").config();

const express = require("express");
const app = express();
const userRoutes = require("./routes/userRoutes");

const rooms = ["general", "tech", "finance", "crypto"];
const cors = require("cors");

const {
  getLastMessagesFromRoom,
  sortRoomMessagesByDate,
} = require("./sockets");
const User = require("./models/User");
const Message = require("./models/Messages");

const server = require("http").createServer(app);

const io = require("socket.io")(server, {
  cors: { origin: "http://localhost:3000", methods: ["GET", "POST"] },
});

const PORT = process.env.PORT;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

app.use("/api/users", userRoutes);
require("./connection");

// socket connection

io.on("connection", (socket) => {
  socket.on("new-user", async () => {
    const members = await User.find();
    io.emit("new-user", members);
  });

  socket.on("join-room", async (newRoom, previousRoom) => {
    socket.join(newRoom);
    socket.leave(previousRoom);
    let roomMessages = await getLastMessagesFromRoom(newRoom);
    roomMessages = sortRoomMessagesByDate(roomMessages);
    socket.emit("room-messages", roomMessages);
  });

  socket.on("message-room", async (room, content, sender, time, date) => {
    const newMessage = await Message.create({
      content,
      from: sender,
      time,
      date,
      to: room,
    });
    let roomMessages = await getLastMessagesFromRoom(room);
    roomMessages = sortRoomMessagesByDate(roomMessages);

    //sending message to room
    io.to(room).emit("room-messages", roomMessages);
    socket.broadcast.emit("notifications", room);
  });

  app.delete("/logout", async (req, res) => {
    try {
      const { _id, newMessages } = req.body;
      const user = await User.findById(_id);
      user.status = "offline";
      user.newMessages = newMessages;
      await user.save();
      const members = await User.find();
      socket.broadcast.emit("new-user", members);
      res.status(200).send();
    } catch (error) {
      console.log("---error", error);
      res.status(400).send();
    }
  });
});

app.get("/rooms", (req, res) => {
  res.json(rooms);
});

server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
