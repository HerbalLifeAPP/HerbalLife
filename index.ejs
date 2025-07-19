// index.js
import express from "express";
import pg from "pg";
import bodyParser from "body-parser";
import bcrypt from "bcrypt";
import env from "dotenv";
import session from "express-session";
import passport from "passport";
import { Strategy } from "passport-local";
import fs from "fs";
import path from "path";

// Initialize environment variables
env.config();

const app = express();
const port = process.env.PORT || 3000;
const saltRounds = 12;

// Set view engine
app.set("view engine", "ejs");

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    },
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// PostgreSQL client setup
const db = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: { rejectUnauthorized: false },
});

// Connect to the database
db.connect();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Routes
app.get("/", (req, res) => res.render("index"));
app.get("/login", (req, res) => res.render("login"));
app.get("/signup", (req, res) => {
  const error = req.session.error;
  req.session.error = null;
  res.render("signup", { error });
});
app.get("/home", (req, res) =>
  req.isAuthenticated() ? res.render("home") : res.redirect("/login")
);
app.get("/meal-logs", (req, res) =>
  req.isAuthenticated() ? res.render("meal-logs") : res.redirect("/login")
);

app.post("/signup", async (req, res) => {
  const { person, email, password } = req.body;
  try {
    const existingUser = await db.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (existingUser.rows.length > 0) {
      return res.status(409).send("Email already in use.");
    }
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);
    const result = await db.query(
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *",
      [person, email, hashedPassword]
    );
    const user = result.rows[0];
    req.login(user, err => {
      if (err) {
        console.error("Sign Up Error:", err.message);
        return res.status(500).json({ error: "Authentication failed. Please try again." });
      }
      return res.redirect("/home");
    });
  } catch (err) {
    console.error("Database Error", err.message);
    return res.status(500).json({ error: "Oops! Something went wrong. Please try again later." });
  }
});

app.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      console.error("Login Error", err.message);
      return res.status(500).json({ error: "Oops! Something went wrong. Please try again later." });
    }
    if (!user) {
      req.session.error = "User not found. Please sign up.";
      return res.redirect("/signup");
    }
    req.login(user, err => {
      if (err) {
        console.error("Login Session Error:", err.message);
        return res.status(500).json({ error: "Session error. Try again." });
      }
      return res.redirect("/home");
    });
  })(req, res, next);
});

// Passport Local Strategy
passport.use(
  new Strategy(async (username, password, cb) => {
    try {
      const result = await db.query(
        "SELECT * FROM users WHERE email = $1",
        [username]
      );
      if (result.rows.length === 0) {
        return cb(null, false, { message: "User does not exist." });
      }
      const user = result.rows[0];
      const isMatch = await bcrypt.compare(password, user.password);
      return isMatch ? cb(null, user) : cb(null, false, { message: "Incorrect Password." });
    } catch (err) {
      return cb(err);
    }
  })
);

passport.serializeUser((user, cb) => cb(null, user.id));
passport.deserializeUser(async (id, cb) => {
  try {
    const result = await db.query(
      "SELECT id, name, email FROM users WHERE id = $1",
      [id]
    );
    return result.rows.length ? cb(null, result.rows[0]) : cb(null, false);
  } catch (err) {
    console.error("Deserialize Error:", err.message);
    cb(err);
  }
});

// Initialize schema and start server
async function initSchema() {
  const sql = fs.readFileSync(path.join(process.cwd(), "schema.sql"), "utf8");
  await db.query(sql);
}

initSchema().then(() => {
  app.listen(port, () => console.log(`Server listening on port ${port}`));
}).catch(err => {
  console.error("Initialization Error:", err.message);
  process.exit(1);
});
