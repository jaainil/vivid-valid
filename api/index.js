const serverless = require("serverless-http");
const app = require("../backend/app.js");

const handler = serverless(app);

module.exports = async (req, res) => {
  return handler(req, res);
};
