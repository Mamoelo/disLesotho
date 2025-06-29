const express = require("express");
const mysql = require("mysql2");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const app = express();
const port = 3000;

// Database connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "123456",
});

// Initialize database and tables
db.connect(async (err) => {
  if (err) throw err;
  console.log("MySQL Connected");

  // Create database if not exists
  await db.promise().query("CREATE DATABASE IF NOT EXISTS media_db");
  await db.promise().query("USE media_db");

  // Create tables if not exist
  const createTables = [
    `CREATE TABLE IF NOT EXISTS posts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            group_name VARCHAR(50) NOT NULL UNIQUE
        )`,
    // Fixed tables with only one automatic timestamp
    `CREATE TABLE IF NOT EXISTS images (
            id INT AUTO_INCREMENT PRIMARY KEY,
            type VARCHAR(10) NOT NULL,
            group_name VARCHAR(50) NOT NULL,
            image_name VARCHAR(255) NOT NULL,
            date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_updated DATETIME,
            image_info TEXT,
            FOREIGN KEY (group_name) REFERENCES posts(group_name)
        )`,
    `CREATE TABLE IF NOT EXISTS videos (
            id INT AUTO_INCREMENT PRIMARY KEY,
            type VARCHAR(10) NOT NULL,
            group_name VARCHAR(50) NOT NULL,
            video_name VARCHAR(255) NOT NULL,
            date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_updated DATETIME,
            video_info TEXT,
            FOREIGN KEY (group_name) REFERENCES posts(group_name)
        )`,
  ];

  for (const query of createTables) {
    try {
      await db.promise().query(query);
    } catch (error) {
      console.error(`Error executing query: ${query}`, error);
    }
  }

  console.log("Database and tables initialized");
});

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const groupName = req.body.group_name;
    const type = file.fieldname;
    let basePath = "";

    if (type === "image") {
      basePath = `uploads/images/${groupName}`;
    } else if (type === "video") {
      basePath = `uploads/videos/${groupName}`;
    }

    if (!fs.existsSync(basePath)) {
      fs.mkdirSync(basePath, { recursive: true });
    }
    cb(null, basePath);
  },
  filename: (req, file, cb) => {
    const groupName = req.body.group_name;
    const fileType = file.fieldname;
    const fileCount = req[fileType + "Count"] || 1;
    const ext = path.extname(file.originalname).toLowerCase();
    const newFilename = `${groupName}_${fileType}${fileCount}${ext}`;
    req[fileType + "Count"] = fileCount + 1;
    cb(null, newFilename);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
}).fields([
  { name: "image", maxCount: 10 },
  { name: "video", maxCount: 10 },
]);

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

// Create post endpoint
app.post("/create-post", (req, res) => {
  upload(req, res, async (err) => {
    if (err) return res.status(500).send(err.message);

    const { title, content } = req.body;
    const groupName = `group_${Date.now()}`;

    try {
      // Create post record
      await db
        .promise()
        .execute("INSERT INTO posts (title, group_name) VALUES (?, ?)", [
          title,
          groupName,
        ]);

      // Save post content to file
      const postDir = `uploads/posts/${groupName}`;
      if (!fs.existsSync(postDir)) fs.mkdirSync(postDir, { recursive: true });
      fs.writeFileSync(
        `${postDir}/${title.replace(/[^a-z0-9]/gi, "_")}.txt`,
        content
      );

      // Process media files
      await processMedia(req.files, groupName, db);

      res.redirect("/");
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).send(error.message);
    }
  });
});

async function processMedia(files, groupName, db) {
  const mediaTypes = ["image", "video"];
  const currentTime = new Date().toISOString().slice(0, 19).replace("T", " ");

  for (const type of mediaTypes) {
    if (files[type]) {
      for (const file of files[type]) {
        const mediaData = {
          type: path.extname(file.originalname).replace(".", ""),
          group_name: groupName,
          media_name: file.filename,
          info: `Uploaded ${type}`,
          last_updated: currentTime,
        };

        await db.promise().execute(
          `INSERT INTO ${type}s (type, group_name, ${type}_name, ${type}_info, last_updated)
                    VALUES (?, ?, ?, ?, ?)`,
          [
            mediaData.type,
            mediaData.group_name,
            mediaData.media_name,
            mediaData.info,
            mediaData.last_updated,
          ]
        );
      }
    }
  }
}

// Get posts endpoint
app.get("/posts", async (req, res) => {
  try {
    const [posts] = await db
      .promise()
      .query("SELECT * FROM posts ORDER BY created_at DESC");

    for (const post of posts) {
      // Get images
      const [images] = await db
        .promise()
        .query("SELECT image_name FROM images WHERE group_name = ?", [
          post.group_name,
        ]);

      // Get videos
      const [videos] = await db
        .promise()
        .query("SELECT video_name FROM videos WHERE group_name = ?", [
          post.group_name,
        ]);

      // Get post content
      const contentPath = `uploads/posts/${
        post.group_name
      }/${post.title.replace(/[^a-z0-9]/gi, "_")}.txt`;
      post.content = fs.existsSync(contentPath)
        ? fs.readFileSync(contentPath, "utf-8")
        : "Content not found";

      post.media = {
        images: images.map(
          (img) => `/uploads/images/${post.group_name}/${img.image_name}`
        ),
        videos: videos.map(
          (vid) => `/uploads/videos/${post.group_name}/${vid.video_name}`
        ),
      };
    }

    res.json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
