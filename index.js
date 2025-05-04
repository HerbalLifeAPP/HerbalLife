import express from "express";
import 'dotenv/config';

const app = express();
const port = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.use(express.static("public"));

app.get("/home", (req, res) => {
  res.render("home.ejs");
});

app.listen(port, () => {
  console.log(`Minimal server listening on port ${port}`);
});
