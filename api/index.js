const serverless = require("serverless-http");
const app = require("../backend/app.js");

const handler = serverless(app);

module.exports.handler = async (event, context) => {
  return handler(event, context);
};
