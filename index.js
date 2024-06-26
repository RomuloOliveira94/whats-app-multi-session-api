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
const WebPush = require("web-push");

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

const appUrl =
  process.env.NODE_ENV === "production"
    ? process.env.APP_URL_PROD
    : process.env.APP_URL_DEV;

const PORT = process.env.PORT || "5000";
app.set("port", PORT);
var server = http.createServer(app);
server.on("listening", () => console.log("APP IS RUNNING ON PORT " + PORT));
const io = new Server(server, {
  cors: {
    origin:
      process.env.NODE_ENV === "production"
        ? [
            "https://projeto-cardapio-virtual.fly.dev",
            "https://projeto-agendamento.fly.dev",
            "https://agendafacil.top",
          ]
        : ["http://localhost:4321", "http://localhost:3000"],
    methods: ["GET", "POST"],
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
    console.log(`user disconnected - ${socket.id}`);
  });
});

server.listen(PORT);

whatsapp.onConnecting((session) => {
  console.log("connecting => ", session);
});

/* whatsapp.onMessageReceived(async (msg) => {
}); */

whatsapp.loadSessionsFromStorage();

const publicKey =
  "BAs_qOrbz-43bWJV_8D7wboilAwOgy-Ny6WGAP_QoCr9udCEDE3gmc6xWBK6kxh_YTypTUIv3G-bqc6zGnXbv2c";
const privateKey = "FvMPuubaeMMaTXuzAN9_s0HWHwOLMZq4nwREnExUi4E";

WebPush.setVapidDetails(appUrl, publicKey, privateKey);
