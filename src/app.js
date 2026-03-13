const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");

const routes = require("./routes");
const swaggerDocs = require("./docs/swagger");
const { notFound, errorHandler } = require("./middlewares/errorMiddleware");
const { sendSuccess } = require("./utils/response");

const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
    errors: []
  }
});

app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    credentials: true
  })
);
app.use(helmet());
app.use(limiter);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.get("/health", (req, res) => {
  sendSuccess(res, {
    message: "Student Project Collaboration Platform API is running",
    data: {
      env: process.env.NODE_ENV || "development"
    }
  });
});

app.use("/api", routes);
swaggerDocs(app);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
