const WebPush = require("web-push");
const publicKey =
  "BAs_qOrbz-43bWJV_8D7wboilAwOgy-Ny6WGAP_QoCr9udCEDE3gmc6xWBK6kxh_YTypTUIv3G-bqc6zGnXbv2c";

exports.publicKey = async (req, res, next) => {
  res.status(200).json({ publicKey });
};

exports.register = async (req, res, next) => {
  try {
    const subscription = req.body;
    console.log(subscription);
    res.status(201).json({});
  } catch (error) {
    next(error);
  }
};

exports.send = async (req, res, next) => {
  try {
    const subscription = req.body;
    const payload = JSON.stringify({
      body: "Você tem um novo agendamento! Clique aqui para ver seus agendamentos.",
    });
    WebPush.sendNotification(subscription, payload);
    res.status(201).json({});
  } catch (error) {
    next(error);
  }
};
