require("dotenv").config();
const express = require("express");
const multer = require("multer");
const bodyParser = require("body-parser");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("./Backend");
const path = require("path");
const fs = require("fs");
const mammoth = require("mammoth");
const { Document, Packer, Paragraph, TextRun } = require("docx");
// At the top of Server.js with other requires
const {
  getNextSession,
  getUpcomingSessions,
  getAchievementCards,
  getPartnersByType,
  getTestimonials,
} = require("./Backend"); // Make sure the path matches your file

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(
  cors({
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Document root setup
const ROOT_DIR = path.join(__dirname, "documents");
if (!fs.existsSync(ROOT_DIR)) fs.mkdirSync(ROOT_DIR);

// Authentication Middleware
app.use((req, res, next) => {
  // List of routes that don't require authentication
  const publicRoutes = [
    "/login",
    "/api/homepage-data",
    "/api/public/partners",
    "/uploads",
    "/favicon.ico",
    "/api/folders/categories",
    "/api/folders/extensions",
    "/api/information-types",
    "/api/partner-types",
    "/api/next-session",
  ];

  // Skip auth check for public routes and preflight requests
  if (
    publicRoutes.some((route) => req.path.startsWith(route)) ||
    req.method === "OPTIONS"
  ) {
    return next();
  }

  // For all other routes, check authentication
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = { adminId: decoded.adminId, roleId: decoded.roleId };
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid token" });
  }
});

// Routes

// Public Routes
app.get("/api/public/partners", async (req, res) => {
  try {
    const partners = await getPartnersByType();
    res.json({ success: true, data: partners });
  } catch (error) {
    console.error("Error fetching partners:", error);
    res.status(500).json({ success: false, error: "Failed to fetch partners" });
  }
});
// In your server.js or app.js
app.get("/api/homepage-data", async (req, res) => {
  try {
    // Fetch data from database
    const breakingNews = await db.getBreakingNews();
    const liveStreams = await db.getLiveStreams();
    const featuredSessions = await db.getFeaturedSessions(3); // Get 3 featured sessions
    const summitCountdown = await db.getSummitCountdown();
    const partners = await db.getPartnersByType();
    const newsArticles = await db.getNewsArticles(3, false); // Get 3 non-breaking news articles
    const cards = await getAchievementCards();
    const testimonials = await getTestimonials();

    res.json({
      success: true,
      data: {
        breakingNews,
        liveStreams,
        featuredSessions,
        summitCountdown,
        partners,
        newsArticles,
        cards,
        testimonials,
      },
    });
  } catch (error) {
    console.error("Error fetching homepage data:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to load homepage data" });
  }
});
// server.js - Add to your routes

// Next session endpoint
app.get("/api/next-session", async (req, res) => {
  try {
    getNextSession((err, session) => {
      if (err) throw err;

      if (!session) {
        // If no immediate next session, get the first upcoming
        getUpcomingSessions(1, (err, sessions) => {
          if (err) throw err;
          res.json(sessions[0] || null);
        });
        return;
      }

      res.json(session);
    });
  } catch (error) {
    console.error("Error fetching next session:", error);
    res.status(500).json({ error: "Failed to load session data" });
  }
});
// Login endpoint
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      error: "MISSING_FIELDS",
      message: "Username and password are required",
    });
  }

  try {
    const admin = await db.getAdminByUsername(username);
    if (!admin) {
      return res.status(401).json({
        error: "INVALID_USERNAME",
        message: "Username not found",
      });
    }

    if (admin.status !== "active") {
      return res.status(401).json({
        error: "ACCOUNT_INACTIVE",
        message: "Account is not active. Contact administrator.",
      });
    }

    let passwordMatch = false;
    try {
      passwordMatch = await bcrypt.compare(password, admin.password_hash);
      if (!passwordMatch) {
        console.warn(
          "Bcrypt comparison failed, falling back to plaintext comparison"
        );
        passwordMatch = password === admin.password_hash;
        if (passwordMatch) {
          console.warn(
            `SECURITY WARNING: User ${username} using plaintext password`
          );
        }
      }
    } catch (error) {
      console.error("Password comparison error:", error);
      return res.status(500).json({
        error: "SERVER_ERROR",
        message: "Internal authentication error",
      });
    }

    if (!passwordMatch) {
      return res.status(401).json({
        error: "INVALID_PASSWORD",
        message: "Incorrect password",
      });
    }

    const token = jwt.sign(
      { adminId: admin.admin_id, roleId: admin.role_id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    db.updateLastLogin(admin.admin_id);
    const roleRow = await db.getAdminRole(admin.role_id);

    res.json({
      message: "Login successful",
      token,
      adminId: admin.admin_id,
      username: admin.username,
      role: {
        id: roleRow.role_id,
        name: roleRow.role_name,
        canAdd: !!roleRow.can_add_content,
        canRemove: !!roleRow.can_remove_content,
        canStartStream: !!roleRow.can_start_stream,
        canSchedule: !!roleRow.can_set_schedule,
        canManageUsers: !!roleRow.can_manage_users,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      error: "SERVER_ERROR",
      message: "Internal server error",
    });
  }
});

// Admin Management Routes
app.post("/api/admins", async (req, res) => {
  try {
    const { username, password, email, full_name, role_id } = req.body;

    if (!username || !password || !email || !role_id) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const existing = await db.getAdminByUsername(username);
    if (existing) {
      return res.status(400).json({ error: "Username already exists" });
    }

    const existingEmail = await db.getAdminByEmail(email);
    if (existingEmail.length > 0) {
      return res.status(400).json({ error: "Email already exists" });
    }

    await db.addAdmin(username, password, email, full_name, role_id);
    res.status(201).json({ message: "Admin created successfully" });
  } catch (error) {
    console.error("Error creating admin:", error);
    res.status(500).json({ error: "Failed to create admin" });
  }
});

app.get("/api/roles", async (req, res) => {
  try {
    const roles = await db.getAdminRoles();
    res.json(roles);
  } catch (error) {
    console.error("Error fetching roles:", error);
    res.status(500).json({ error: "Failed to fetch roles" });
  }
});

app.get("/api/admins", async (req, res) => {
  try {
    const admins = await db.getAdmins();
    res.json(admins);
  } catch (error) {
    console.error("Error fetching admins:", error);
    res.status(500).json({ error: "Failed to fetch admins" });
  }
});

app.put("/api/admins/:id", async (req, res) => {
  try {
    const adminId = req.params.id;
    const { email, full_name, role_id, status } = req.body;

    if (!email || !role_id || !status) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const admin = await db.getAdminById(adminId);
    if (admin.length === 0) {
      return res.status(404).json({ error: "Admin not found" });
    }

    if (email !== admin[0].email) {
      const emailCheck = await db.getAdminByEmailExcludingId(email, adminId);
      if (emailCheck.length > 0) {
        return res.status(400).json({ error: "Email already in use" });
      }
    }

    await db.updateAdmin(adminId, email, full_name, role_id, status);
    res.json({ message: "Admin updated successfully" });
  } catch (error) {
    console.error("Error updating admin:", error);
    res.status(500).json({ error: "Failed to update admin" });
  }
});
app.get("/api/homepage-data", async (req, res) => {
  try {
    // Temporary mock data - replace with real database calls
    const mockData = {
      breakingNews: [],
      liveStreams: [],
      featuredSessions: [],
      summitCountdown: { days: 30, hours: 12, minutes: 0 },
      partners: [],
      newsArticles: [],
    };

    res.json({
      success: true,
      data: mockData,
    });
  } catch (error) {
    console.error("Error fetching homepage data:", error);
    res.status(500).json({
      success: false,
      error: "Failed to load homepage data",
    });
  }
});

app.delete("/api/admins/:id", async (req, res) => {
  try {
    const adminId = req.params.id;
    const admin = await db.getAdminById(adminId);

    if (admin.length === 0) {
      return res.status(404).json({ error: "Admin not found" });
    }

    if (parseInt(adminId) === parseInt(req.admin.adminId)) {
      return res
        .status(400)
        .json({ error: "You cannot delete your own account" });
    }

    await db.softDeleteAdmin(adminId);
    res.json({ message: "Admin deleted successfully" });
  } catch (error) {
    console.error("Error deleting admin:", error);
    res.status(500).json({ error: "Failed to delete admin" });
  }
});

app.get("/api/admins/deleted", async (req, res) => {
  try {
    const rows = await db.getRecentlyDeletedAdmins();
    res.json(rows);
  } catch (err) {
    console.error("Error fetching deleted admins:", err);
    res.status(500).json({ error: "Failed to fetch deleted admins" });
  }
});

app.post("/api/admins/:id/restore", async (req, res) => {
  try {
    const adminId = req.params.id;
    await db.restoreAdmin(adminId);
    res.json({ message: "Admin restored successfully" });
  } catch (err) {
    console.error("Error restoring admin:", err);
    res.status(500).json({ error: "Failed to restore admin" });
  }
});

// Folder and File Management Routes
app.get("/api/folders/categories", async (req, res) => {
  const cats = await db.getFolderCategories();
  res.json(cats);
});

app.get("/api/folders/extensions/:categoryId", async (req, res) => {
  const exts = await db.getFolderExtensions(req.params.categoryId);
  res.json(exts);
});

app.post("/api/folders/create", async (req, res) => {
  const { categoryName, extensionName, subject, itemTitle } = req.body;
  try {
    const fullPath = await db.ensureFolders({
      baseDir: path.join(__dirname, "uploads"),
      categoryName,
      extensionName,
      subject,
      itemTitle,
    });
    res.json({ success: true, path: fullPath });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const { categoryName, extensionName, subject, itemTitle } = req.body;
    const fullDir = await db.ensureFolders({
      baseDir: path.join(__dirname, "uploads"),
      categoryName,
      extensionName,
      subject,
      itemTitle,
    });
    cb(null, fullDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "_" + file.originalname);
  },
});

const upload = multer({ storage });

app.post("/api/upload", upload.array("mediaFiles"), (req, res) => {
  res.json({ success: true, files: req.files });
});

// Document Management Routes
app.post("/api/categories", (req, res) => {
  const { name, parent } = req.body;
  if (!name) return res.status(400).json({ error: "Category name required" });

  const targetDir = parent
    ? path.join(ROOT_DIR, parent, name)
    : path.join(ROOT_DIR, name);

  try {
    fs.mkdirSync(targetDir, { recursive: true });
    return res.status(201).json({
      message: "Category created",
      category: parent ? `${parent}/${name}` : name,
    });
  } catch (err) {
    console.error("Error creating category:", err);
    return res.status(500).json({ error: "Failed to create category" });
  }
});

app.get("/api/categories", (req, res) => {
  function walk(dir, base = "") {
    let list = [];
    fs.readdirSync(dir, { withFileTypes: true }).forEach((dirent) => {
      if (dirent.isDirectory()) {
        const rel = base ? `${base}/${dirent.name}` : dirent.name;
        list.push(rel);
        list = list.concat(walk(path.join(dir, dirent.name), rel)); // Fixed this line
      }
    });
    return list;
  }

  try {
    const cats = walk(ROOT_DIR);
    if (!cats.includes("default")) cats.unshift("default");
    return res.json(cats);
  } catch (err) {
    console.error("Error listing categories:", err);
    return res.status(500).json({ error: "Failed to list categories" });
  }
});

app.get("/api/docs", (req, res) => {
  const cat = req.query.category || "default";
  const dir = path.join(ROOT_DIR, cat);
  if (!fs.existsSync(dir)) return res.json([]);
  const docs = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".docx"))
    .map((f) => f.replace(/\.docx$/i, ""));
  res.json(docs);
});

app.post("/api/docs", async (req, res) => {
  const { category = "default", name, content } = req.body;
  const dir = path.join(ROOT_DIR, category);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const filename = name.toLowerCase().endsWith(".docx") ? name : name + ".docx";
  const filePath = path.join(dir, filename);

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [new Paragraph({ children: [new TextRun(content)] })],
      },
    ],
  });
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(filePath, buffer);

  res.sendStatus(201);
});

app.get("/api/docs/:category/:name", async (req, res) => {
  const { category, name } = req.params;
  const filePath = path.join(ROOT_DIR, category, name + ".docx");
  if (!fs.existsSync(filePath)) return res.sendStatus(404);
  try {
    const buffer = fs.readFileSync(filePath);
    const { value: text } = await mammoth.extractRawText({ buffer });
    res.json({ content: text.trim() });
  } catch (err) {
    console.error("DOCX parse error:", err);
    res.status(500).json({ error: "Failed to parse document" });
  }
});

app.put("/api/docs/:category/:name", async (req, res) => {
  const { category, name } = req.params;
  const { content } = req.body;
  const dir = path.join(ROOT_DIR, category);
  const filename = name.toLowerCase().endsWith(".docx") ? name : name + ".docx";
  const filePath = path.join(dir, filename);
  if (!fs.existsSync(filePath)) return res.sendStatus(404);
  const doc = new Document({
    sections: [
      { children: [new Paragraph({ children: [new TextRun(content)] })] },
    ],
  });
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(filePath, buffer);
  res.sendStatus(200);
});

app.get("/api/docs/:category/:name/download", (req, res) => {
  const { category, name } = req.params;
  const filePath = path.join(ROOT_DIR, category, name + ".docx");
  if (!fs.existsSync(filePath)) return res.sendStatus(404);
  res.download(filePath);
});

// Content Management Routes
app.post("/api/content-details", async (req, res) => {
  const adminId = req.admin.adminId;
  const { title, content } = req.body;
  if (!title || !content)
    return res.status(400).json({ error: "Missing fields" });

  try {
    await db.createContentDetailWithDocx(title, content, adminId);
    res.status(201).json({ message: "Content and Docx created" });
  } catch (err) {
    console.error("Error creating content detail:", err);
    res.status(500).json({ error: "Failed to create document" });
  }
});

app.get("/api/content-details", (req, res) => {
  db.getContentDetails((err, rows) => {
    if (err)
      return res.status(500).json({ error: "Failed to fetch content details" });
    res.json(rows);
  });
});

app.delete("/api/content-details/:id", (req, res) => {
  const id = req.params.id;
  db.deleteContentDetail(id, (err) => {
    if (err) return res.status(500).json({ error: "Delete failed" });
    res.sendStatus(204);
  });
});

app.get("/api/content-details/:id", async (req, res) => {
  const id = req.params.id;
  db.getContentDetailById(id, async (err, rec) => {
    if (err) return res.status(404).json({ error: err.message });
    const fullPath = path.join(
      __dirname,
      "uploads",
      rec.folder_path,
      rec.folder_name
    );
    if (!fs.existsSync(fullPath))
      return res.status(404).json({ error: "File not found" });
    try {
      const buffer = fs.readFileSync(fullPath);
      const { value } = await mammoth.extractRawText({ buffer });
      res.json({
        detail_id: rec.detail_id,
        code_name: rec.code_name,
        created_at: rec.created_at,
        updated_at: rec.updated_at,
        content: value.trim(),
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to read document" });
    }
  });
});

app.put("/api/content-details/:id", async (req, res) => {
  const id = req.params.id;
  const { title, content } = req.body;
  db.getContentDetailById(id, async (err, rec) => {
    if (err) return res.status(404).json({ error: err.message });
    const fullPath = path.join(
      __dirname,
      "uploads",
      rec.folder_path,
      rec.folder_name
    );
    if (!fs.existsSync(fullPath))
      return res.status(404).json({ error: "File not found" });
    try {
      const doc = new Document({
        sections: [
          {
            children: [
              new Paragraph({ text: title, heading: "Heading1" }),
              new Paragraph(content),
            ],
          },
        ],
      });
      const buffer = await Packer.toBuffer(doc);
      fs.writeFileSync(fullPath, buffer);
      const sql = `UPDATE content_details SET updated_at=CURRENT_TIMESTAMP WHERE detail_id=?`;
      db.query(sql, [id], (err2) => {
        if (err2) console.error(err2);
        res.json({ message: "Updated" });
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to update" });
    }
  });
});

// Serve frontend
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Purge old deleted admins
setInterval(() => {
  db.query(
    `DELETE FROM admins
     WHERE status = 'deleted'
       AND deleted_at < DATE_SUB(NOW(), INTERVAL 7 DAY)`,
    (err) => {
      if (err) console.error("Purge old deleted admins failed:", err);
      else console.log("Purged admins soft-deleted >7 days ago");
    }
  );
}, 24 * 60 * 60 * 1000);

function createPlaceholderSVG(text, width = 300, height = 200) {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#e0e0e0"/>
      <text x="50%" y="50%" fill="#555" font-family="Arial" 
            font-size="14" text-anchor="middle" dominant-baseline="middle">
        ${text.substring(0, 20)} <!-- Limit text length -->
      </text>
    </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}
