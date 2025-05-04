import express from "express";
import 'dotenv/config';

const app = express();
const port = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.render("index", { message: "Hello from EJS and Azure!" });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
