require("dotenv").config({
  path: "./.env",
});
const app = require("./src/app");
const http = require("http");
const connectDatabase = require("./src/db/db");
const { initSocketIo } = require("./src/socket/socket");

const port = process.env.PORT || 3000;

const httpServer = http.createServer(app);

connectDatabase();
initSocketIo(httpServer);

httpServer.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
