require("dotenv").config({
  path: "./.env",
});
const express = require("express");
const { app, server } = require("./socket/socket");
const logger = require("morgan");
const ErrorHandler = require("./utils/ErrorHandler");
const { generateError } = require("./middlewares/errors.middleware");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const MongoStore = require("connect-mongo");

const port = process.env.PORT || 3000;

const userRouter = require("./routes/user.routes");
const chatRouter = require("./routes/chat.routes");
const messageRouter = require("./routes/message.routes");
const statusRouter = require("./routes/status.routes");

// database connection
require("./config/db.config").connectDatabase();

// Apply rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per 15 minutes
  message: "Too many requests from this IP, Please try again later.",
});

app.use(limiter);

// cors and helmet for security middlewares
app.use(
  cors({
    origin: [process.env.REACT_BASE_URL, "http://localhost:5173"],
    credentials: true,
  })
);
app.use(helmet());

app.set("trust proxy", 1);

// session and cookie-parser
app.use(cookieParser());
app.use(
  session({
    resave: false,
    saveUninitialized: false,
    secret: process.env.EXPRESS_SESSION_SECRET,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URL,
      collectionName: "sessions",
      ttl: 14 * 24 * 60 * 60, // session lifetime in seconds (14 days here)
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // requires trust proxy
      sameSite: "none",
    },
  })
);

// express-fileupload
app.use(fileUpload({ limits: { fileSize: 20 * 1024 * 1024 } })); // 20 MB

// body-parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// logger
app.use(logger("tiny"));

// routes
app.use("/api/users/", userRouter);
app.use("/api/chats/", chatRouter);
app.use("/api/messages/", messageRouter);
app.use("/api/status/", statusRouter);

// error-handling
app.all("*", (req, res, next) => {
  return next(new ErrorHandler(`Requested URL Not Found ${req.url}`, 404));
});
app.use(generateError);

// creating server
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
