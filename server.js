if (process.env.NODE_ENV !== 'production') {
  require("dotenv").config();
}
const express = require("express");
const expressLayout = require("express-ejs-layouts");
const dbConfig = require("./config/dbConfig");
const passport = require("passport");
const oAuth = require("./auth/passport");
const session = require("express-session");
const flash = require("connect-flash");
const methodOverride = require("method-override");
const User = require("./models/users");
const multer = require("multer");

const cors = require("cors");

const app = express();

const indexRouter = require("./routes/index");
const userRouter = require("./routes/user");
const adminRouter = require("./routes/admin");

app.set("view engine", "ejs");
app.set("layout", "layouts/masterLayout");
app.set("layout extractScripts", true);

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// Handle preflight OPTIONS requests
app.options('*', cors());
app.use(express.static("public"));
app.use(expressLayout);
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
// app.use(multer().none()); // Parse multipart/form-data without files - REMOVED: Causing conflict with file uploads
app.use(methodOverride("_method"));

// Debug Middleware: Log all requests
// app.use((req, res, next) => {
//   console.log(`[DEBUG] ${req.method} ${req.url}`);
//   next();
// });

app.use(
  session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(flash());

app.use(function (req, res, next) {
  res.set(
    "Cache-Control",
    "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
  );
  next();
});

app.use(express.static("public", {
  setHeaders: (res, path) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization, X-Requested-With');
    res.set('Cache-Control', 'no-cache');
    // Set content type based on file extension
    if (path.endsWith('.js')) {
      res.set('Content-Type', 'application/javascript');
    } else if (path.endsWith('.css')) {
      res.set('Content-Type', 'text/css');
    }
  }
}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//facebook and google oAuth
oAuth();

app.use(function (req, res, next) {
  if (req.isAuthenticated()) {
    res.locals.user = true;
    res.locals.userName = req.user.name;
  }
  next();
});

app.use("/", indexRouter);
app.use("/user", userRouter);
app.use("/admin", adminRouter);

app.use(function (req, res, next) {
  // console.log(`[DEBUG] 404 Handler Hit for ${req.url}`);
  res.status(404);
  if (req.xhr || req.accepts('json')) {
    return res.json({ message: "Not Found" });
  }
  if (req.accepts("html")) {
    res.render("errorPage/error", { layout: false });
    return;
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[DEBUG] Global Error Handler:', err);
  if (!res.headersSent) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log("server is up and running on port " + PORT));
}

// Ensure category index allows same name across different divisions
const mongoose = require('./config/dbConfig');
const Category = require('./models/category');

mongoose.connection.once('open', async () => {
  try {
    // Attempt to drop old single-field unique index on categoryName if it exists
    try {
      await Category.collection.dropIndex('categoryName_1');
      console.log('Dropped old categoryName unique index');
    } catch (dropErr) {
      // ignore if index does not exist
    }

    // Create compound unique index on categoryName + division
    await Category.collection.createIndex({ categoryName: 1, division: 1 }, { unique: true });
    console.log('Ensured compound unique index on categoryName + division');
  } catch (err) {
    console.log('Error ensuring category indexes:', err.message);
  }
});

module.exports = app;
