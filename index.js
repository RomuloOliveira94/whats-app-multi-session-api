const { config } = require("dotenv");
const express = require("express");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const http = require("http");
const path = require("path");
const MainRouter = require("./app/routers");
const errorHandlerMiddleware = require("./app/middlewares/error_middleware");
const whatsapp = require("wa-multi-session");
const { Server } = require("socket.io");
/* const { GREETINGS } = require("./utils/consts"); */

config();

var app = express();
app.use(morgan("dev"));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.set("view engine", "ejs");
// Public Path
app.use("/p", express.static(path.resolve("public")));
app.use("/p/*", (req, res) => res.status(404).send("Media Not Found"));

app.use(MainRouter);

app.use(errorHandlerMiddleware);

const PORT = process.env.PORT || "5000";
app.set("port", PORT);
var server = http.createServer(app);
server.on("listening", () => console.log("APP IS RUNNING ON PORT " + PORT));
const io = new Server(server, {
  cors: {
    origin: "http://localhost:4321",
  },
});

//socket io - to notify new orders
let users = {};
io.on("connection", (socket) => {
  socket.on("userConnected", (userId) => {
    users[userId] = socket;
    console.log("user: ", userId);
    console.log("socket.id: ", socket.id);
    socket.emit("userConnected", "Conectado com sucesso! com o id: " + userId);
  });

  socket.on("pedidoCriado", (data) => {
    if (!users[data.company])
      return console.log(`Empresa: ${data.company} não conectada`);
    users[data.company].emit("pedidoCriado", data);
  });

  socket.on("disconnect", () => {
    for (let userId in users) {
      if (users[userId] === socket) {
        delete users[userId];
        break;
      }
    }
    console.log("disconnect");
  });
});

server.listen(PORT);

whatsapp.onConnected((session) => {
  console.log("connected => ", session);
});

whatsapp.onDisconnected((session) => {
  console.log("disconnected => ", session);
});

whatsapp.onConnecting((session) => {
  console.log("connecting => ", session);
});

whatsapp.onMessageReceived(async (msg) => {
  console.log(`New Message Received On Session: ${msg.sessionId} >>>`, msg);
  if (
    msg.key.fromMe ||
    msg.key.remoteJid.includes("status") ||
    msg.message?.senderKeyDistributionMessage?.groupId
  )
    return;
});

whatsapp.loadSessionsFromStorage();
