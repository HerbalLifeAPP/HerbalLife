// lOAD .ENV IN THE DEV BEFORE ANYTHING ELSE
import 'dotenv/config';
import express from "express";
import pg from "pg";
import bodyParser from "body-parser";
import bcrypt from "bcrypt";
import session from "express-session";
import passport from "passport";
import { Strategy } from "passport-local";

const app = express();
const port = process.env.PORT || 3000; // Azure injects PORT via environment variables
const saltRounds = 12;
// Initialize env
env.config();

app.set("view engine", "ejs"); //Setting EJS as a view engine

// Initialize session
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' // HTTPS-only in production
    },
  })
);

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Initialize Database
const db = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME, // Changed from DB_DATABASE to match ARM template
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});
db.connect();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Routes
app.get("/", (req, res) => {
  res.render("index.ejs");
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.get("/signup", (req, res) => {
  const error = req.session.error;
  req.session.error = null;
  res.render("signup", { error }); // Express automatically finds sign.ejs up in the views
});

app.get("/home", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("home.ejs");
  } else {
    res.redirect("/login");
  }
});

app.post("/signup", async (req, res) => {
  const { person, email, password } = req.body;

  try {
    // Check if user exists
    const existingUser = await db.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (existingUser.rows.length > 0) {
      return res.status(409).send("Email already in use.");
    } else {
      // Hash password
      const salt = await bcrypt.genSalt(saltRounds);
      const hashedPassword = await bcrypt.hash(password, salt);
      //  Send data to database
      const result = await db.query(
        "INSERT INTO users (name,email,password) VALUES ($1, $2, $3) RETURNING *",
        [person, email, hashedPassword]
      );
      const user = result.rows[0];
      req.login(user, (err) => {
        if (err) {
          console.error("Sign Up Error:", err.message);
          return res
            .status(500)
            .json({ error: "Authentication failed. Please try again." });
        }
        return res.redirect("/home");
      });
    }
  } catch (err) {
    console.error("Database Error", err.message);
    return res
      .status(500)
      .json({ error: "Oops! Something went wrong. Please try again later." });
  }
});

app.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    // Check for system errors
    if (err) {
      console.error("Login Error", err.message);
      return res
        .status(500)
        .json({ error: "Oops! Something went wrong. Please try again later." });
    }

    // If user is not found ot password in incorrect
    if (!user) {
      req.session.error = "User not found. Please sign up.";
      return res.redirect("/signup");
      // return res.status(401).json({ error: info.message });
    }

    // Log user in
    req.login(user, (err) => {
      if (err) {
        console.error("Login Session Error:", err.message);
        return res.status(500).json({ error: "Session error. Try again." });
      }
      // If log in successful redirect to home
      return res.redirect("/home");
    });
  })(
    // Manually invoke passport. authenticate
    req,
    res,
    next
  );
});

// Register new Strategy
passport.use(
  new Strategy(async function verify(username, password, cb) {
    try {
      //  Check if email exists in database
      const result = await db.query("SELECT * FROM users WHERE email = $1", [
        username,
      ]);
      if (result.rows.length === 0) {
        return cb(null, false, { message: "User does not exist." });
      }
      const user = result.rows[0];
      const storedHashedPassword = user.password;

      // Compare if provided password is the same as password in database
      const isMatch = await bcrypt.compare(password, storedHashedPassword);

      if (isMatch) {
        return cb(null, user);
      } else {
        return cb(null, false, { message: "Incorrect Password." });
      }
    } catch (err) {
      return cb(err);
    }
  })
);

passport.serializeUser((user, cb) => {
  cb(null, user.id);
});

passport.deserializeUser(async (id, cb) => {
  try {
    const result = await db.query(
      "SELECT id, name, email FROM users WHERE id = $1",
      [id]
    );
    if (result.rows.length === 0) {
      return cb(null, false);
    }
    // Fetch user from the database
    cb(null, result.rows[0]);
  } catch (err) {
    console.log("Deserialize Error:", err.message);
    cb(err);
  }
});

// Start Server
app.listen(port, () => {
  console.log(`Server listening at port ${port}`);
});
