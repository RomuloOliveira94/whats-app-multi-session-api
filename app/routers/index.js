const { Router } = require("express");
const MessageRouter = require("./message_router");
const SessionRouter = require("./session_router");
const NotificationRouter = require("./notification_router");

const MainRouter = Router();

MainRouter.use(SessionRouter);
MainRouter.use(MessageRouter);
MainRouter.use(NotificationRouter);

module.exports = MainRouter;
