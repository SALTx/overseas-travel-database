import express from "express";
import database from "./database.js";
import fs from "fs";
import chalk from "chalk";

const router = express.Router();

// Middleware to add session to res.locals
router.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

router.get("/", (req, res) => {
  res.render("index", {
    page: "index",
    title: "Home",
  });
});

router.get("/students", async (req, res) => {
  const students = await database.executeQuery("SELECT * FROM students");
  const partialExists = fs.existsSync(`views/partials/controls/students.ejs`);

  res.render("universal", {
    page: "Students",
    table: "students",
    title: "Students",
    data: students,
    partialExists: partialExists,
  });
});

router.get("/overseasprograms", async (req, res) => {
  const overseasprograms = await database.executeQuery(
    "SELECT * FROM overseasprograms"
  );
  const partialExists = fs.existsSync(
    `views/partials/controls/overseasprograms.ejs`
  );

  res.render("universal", {
    page: "Overseas Programs",
    table: "overseasprograms",
    title: "Overseas Programs",
    data: overseasprograms,
    partialExists,
  });
});

router.get("/resources", async (req, res) => {
  res.render("resources", {
    page: "Resources",
    title: "Resources",
  });
});
// Auth routes
router.get("/login", (req, res) => {
  const { error } = req.query;

  res.render("login", {
    page: "Login",
    title: "Login",
    error: error ? "Invalid username or password" : "",
  });
});

router.post("/login", (req, res) => {
  const { username, password } = req.body;
  const query = `SELECT * FROM users WHERE username = '${username}' AND BINARY password = '${password}'`;
  database.executeQuery(query).then((result) => {
    if (result.length == 1) {
      delete result[0].password;
      req.session.user = result[0];
      req.session.save();

      res.redirect("/");
    } else {
      res.redirect("/login?error=1");
    }
  });
});

router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

// Database routes
router.get("/database/views/kpi/:num", async (req, res) => {
  const num = req.params.num;
  if (num < 1 || num > 4) {
    res.send("Invalid KPI number");
    return;
  }
  const kpi = await database.executeQuery(`SELECT * FROM kpi${num}`);
  res.send(kpi);
});

// uploading file
router.post("/upload", (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    res.send("No files were uploaded.");
    return;
  } else {
    // rename the file to user's name and timestamp
    const file = req.files.file;
    const filetype = file.mimetype.split("/")[1];
    const filename = `${req.body.name}_${Date.now()}.${filetype}`;

    file.mv(`public/uploads/${filename}`, (err) => {
      if (err) {
        res.send("Error uploading file");
      } else {
        res.send("File uploaded");
      }
    });

    // once its uploaded, add it to the database
  }
});

export default router;