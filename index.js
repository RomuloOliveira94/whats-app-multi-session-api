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
    origin: ["http://localhost:4321", "http://localhost:3000"],
  },
});

//socket io - to notify new orders
let users = {};
io.on("connection", (socket) => {
  socket.on("userConnected", (userId) => {
    if (users[userId]) {
      users[userId].disconnect();
    }
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

  socket.on("agendamentoCriado", (data) => {
    console.log(data);
    if (!users[data]) return console.log(`Empresa: ${data} não conectada`);
    users[data].emit("agendamentoCriado", data);
  });

  whatsapp.onConnected((session) => {
    console.log("connected => ", session);
    users[session].emit("WhatsAppConnect", session);
  });

  whatsapp.onDisconnected((session) => {
    console.log("disconnected => ", session);
    users[session].emit("WhatsAppDisconnect", "WhatsApp Desconectado!");
  });

  socket.on("error", (error) => {
    console.error(error);
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

whatsapp.onConnecting((session) => {
  console.log("connecting => ", session);
});

/* whatsapp.onMessageReceived(async (msg) => {
}); */

whatsapp.loadSessionsFromStorage();
