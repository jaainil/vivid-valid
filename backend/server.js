const app = require("./app.js");
const PORT = process.env.PORT || 3001;

// On Vercel, we DO NOT call listen(); the serverless function will handle requests.
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Vivid Valid Email Validator API running on port ${PORT}`);
    console.log(`📧 Ready to validate emails with world-class accuracy!`);
  });
}

module.exports = app;
