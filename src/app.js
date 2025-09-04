const express = require("express");
const app = express();
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
const path = require("path");

const userRoutes = require("./routes/user.routes");
const chatRoutes = require("./routes/chat.routes");
const messageRoutes = require("./routes/message.routes");
const statusRoutes = require("./routes/status.routes");

// Apply rate limiting
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // limit each IP to 100 requests per 15 minutes
//   message: "Too many requests from this IP, Please try again later.",
// });

// app.use(limiter);

// cors and helmet for security middlewares
app.use(
  cors({
    origin: [process.env.REACT_BASE_URL],
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
      mongoUrl: process.env.MONGODB_ATLAS_URI,
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
app.use(logger("dev"));

// routes
app.use("/api/users/", userRoutes);
app.use("/api/chats/", chatRoutes);
app.use("/api/messages/", messageRoutes);
app.use("/api/status/", statusRoutes);

app.use(express.static(path.join(__dirname, "../public")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"))
})

// error-handling
app.all("*", (req, res, next) => {
  return next(new ErrorHandler(`Requested URL Not Found ${req.url}`, 404));
});
app.use(generateError);

module.exports = app;
