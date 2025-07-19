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

// Load .env
env.config();

const app = express();
const port = process.env.PORT || 3000;
const saltRounds = 12;

// Use EJS and serve static from your capital‑P folder
app.set("view engine", "ejs");
app.use(express.static("Public"));    // ← match your existing folder name

// Parse form bodies
app.use(bodyParser.urlencoded({ extended: true }));

// Session
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 },
  })
);

// Passport
app.use(passport.initialize());
app.use(passport.session());

// PostgreSQL
const db = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: { rejectUnauthorized: false },
});
db.connect();

// ——— ROUTES ———

// Home page
app.get("/", (req, res) => {
  res.render("index");
});

// Signup
app.get("/signup", (req, res) => {
  const error = req.session.error;
  req.session.error = null;
  res.render("signup", { error });
});
app.post("/signup", async (req, res) => {
  const { person, email, password } = req.body;
  try {
    const { rows } = await db.query(
      "SELECT 1 FROM users WHERE email = $1",
      [email]
    );
    if (rows.length) {
      req.session.error = "Email already in use.";
      return res.redirect("/signup");
    }
    const hash = await bcrypt.hash(password, saltRounds);
    const result = await db.query(
      "INSERT INTO users (name,email,password) VALUES ($1,$2,$3) RETURNING *",
      [person, email, hash]
    );
    req.login(result.rows[0], (err) => {
      if (err) throw err;
      res.redirect("/home");
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// Login
app.get("/login", (req, res) => res.render("login"));
app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/home",
    failureRedirect: "/login",
  })
);

// Protected home
app.get("/home", (req, res) =>
  req.isAuthenticated() ? res.render("home", { user: req.user }) : res.redirect("/login")
);

// Meal logs list + form
app.get("/meal-logs", (req, res) =>
  req.isAuthenticated()
    ? res.render("meal-logs", { user: req.user })
    : res.redirect("/login")
);

// Handle meal-log POST
app.post("/meal-logs", async (req, res) => {
  if (!req.isAuthenticated()) return res.redirect("/login");
  const { date, time, mealType, description, calories } = req.body;
  try {
    await db.query(
      `INSERT INTO meal_logs
         (user_id, log_date, meal_type, description, calories)
       VALUES ($1,$2,$3,$4,$5)`,
      [
        req.user.id,
        `${date} ${time}`,
        mealType,
        description || null,
        calories ? Number(calories) : null,
      ]
    );
    res.redirect("/meal-logs");
  } catch (err) {
    console.error(err);
    res.status(500).send("Could not save your meal.");
  }
});

// Passport local strategy
passport.use(
  new Strategy(async (username, password, cb) => {
    try {
      const { rows } = await db.query(
        "SELECT * FROM users WHERE email = $1",
        [username]
      );
      if (!rows.length) return cb(null, false);
      const user = rows[0];
      const ok = await bcrypt.compare(password, user.password);
      return ok ? cb(null, user) : cb(null, false);
    } catch (err) {
      return cb(err);
    }
  })
);

passport.serializeUser((u, cb) => cb(null, u.id));
passport.deserializeUser(async (id, cb) => {
  try {
    const { rows } = await db.query(
      "SELECT id,name,email FROM users WHERE id = $1",
      [id]
    );
    cb(null, rows[0] || false);
  } catch (e) {
    cb(e);
  }
});

// Initialize schema then start
async function initSchema() {
  const sql = fs.readFileSync(path.join(process.cwd(), "schema.sql"), "utf8");
  await db.query(sql);
}

initSchema()
  .then(() => app.listen(port, () => console.log(`Listening on ${port}`)))
  .catch((err) => {
    console.error("Init error:", err);
    process.exit(1);
  });
