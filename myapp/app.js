const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const layouts = require("express-ejs-layouts");
const pw_auth_router = require("./routes/pwauth");
const transactionsRouter = require("./routes/transactions");

// init darkMode variables
let darkMode = false;

/* **************************************** */
/*  Connecting to a Mongo Database Server   */
/* **************************************** */
const mongodb_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/pwdemo";
console.log("MONGODB_URI=", process.env.MONGODB_URI);

const mongoose = require("mongoose");

mongoose.connect(mongodb_URI);

const db = mongoose.connection;

db.on("error", console.error.bind(console, "Connection error: "));
db.once("open", () => {
  console.log("we are connected!!!");
});

/* **************************************** */
/* Enable sessions and storing session data in the database */
/* **************************************** */
const session = require("express-session");
var MongoDBStore = require("connect-mongodb-session")(session);

const store = new MongoDBStore({
  uri: mongodb_URI,
  collection: "mySessions",
});

// catch errors
store.on("error", (error) => {
  console.log(error);
});

/* **************************************** */
/*  middleware to make sure a user is logged in */
/* **************************************** */
function isLoggedIn(req, res, next) {
  "if they are logged in, continue; otherwise redirect to /login ";
  if (res.locals.loggedIn) {
    next();
  } else {
    res.redirect("/login");
  }
}

/* **************************************** */
/* creating the app */
/* **************************************** */
const app = express();

app.use(
  session({
    secret: "This is a secret",
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    },
    store: store,
    resave: true,
    saveUninitialized: true,
  })
);

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use(layouts);
app.use(pw_auth_router);

app.get("/", (req, res, next) => {
  res.render("index", { darkMode });
});

app.use(transactionsRouter);

// dark mode toggle
app.get("/toggle-dark-mode", (req, res) => {
  darkMode = !darkMode;
  res.redirect("/");
});

// catch 404 errors
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
app.use((err, req, res, next) => {
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
