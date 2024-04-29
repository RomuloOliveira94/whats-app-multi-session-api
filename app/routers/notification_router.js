const { Router } = require("express");
const {
  publicKey,
  send,
  register,
} = require("../controllers/notifications_controller");
const NotificationRouter = Router();

NotificationRouter.all("/push/publicKey", publicKey);
NotificationRouter.all("/push/register", register);
NotificationRouter.all("/push/send", send);

module.exports = NotificationRouter;
