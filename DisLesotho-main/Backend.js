// Backend.js
const mysql = require("mysql2");
const bcrypt = require("bcrypt"); // New
require("dotenv").config();

// Database connection setup (new)
const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "123456",
  database: process.env.DB_DATABASE || "content_management_system",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

db.getConnection((err, connection) => {
  if (err) {
    console.error("Database connection failed:", err);
  }
  console.log("Connected to CMS database");
  connection.release();
});

// Admin Functions
// addAdmin edit for password
const addAdmin = async (username, password, email, full_name, role_id) => {
  const saltRounds = 10;
  const password_hash = await bcrypt.hash(password, saltRounds);

  return new Promise((resolve, reject) => {
    db.query(
      `INSERT INTO admins (username, password_hash, email, full_name, role_id)
       VALUES (?, ?, ?, ?, ?)`,
      [username, password_hash, email, full_name, role_id],
      (err, results) => {
        if (err) return reject(err);
        resolve(results);
      }
    );
  });
};

const getAdminByUsername = (username) => {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT admin_id, username, password_hash, role_id, status
        FROM admins 
        WHERE username = ?`,
      [username],
      (err, results) => {
        if (err) return reject(err);
        resolve(results[0]);
      }
    );
  });
};

const getAdminRole = (role_id) => {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT 
         role_id,
         role_name,
         can_add_content,
         can_remove_content,
         can_start_stream,
         can_set_schedule,
         can_manage_users
       FROM admin_roles
       WHERE role_id = ?`,
      [role_id],
      (err, results) => {
        if (err) return reject(err);
        resolve(results[0]); // returns the first (and only) matching role
      }
    );
  });
};

// Update last login time
const updateLastLogin = (adminId) => {
  db.query(
    `UPDATE admins SET last_login = CURRENT_TIMESTAMP WHERE admin_id = ?`,
    [adminId],
    (err, result) => {
      if (err) {
        console.error("Update login failed:", err);
      }
    }
  );
};

// New functions for admin management
const getAdminRoles = () => {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT role_id, role_name 
       FROM admin_roles 
       WHERE role_name != 'Super Admin'`,
      (err, results) => {
        if (err) {
          console.error("Error fetching admin roles:", err);
          return reject(err);
        }
        resolve(results);
      }
    );
  });
};

const getAdmins = () => {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT a.admin_id, a.username, a.email, a.full_name, a.status, 
              r.role_name, r.role_id
       FROM admins a
       LEFT JOIN admin_roles r ON a.role_id = r.role_id
       WHERE a.status != 'deleted'
       ORDER BY a.created_at DESC`,
      (err, results) => {
        if (err) {
          console.error("Error fetching admins:", err);
          return reject(err);
        }
        resolve(results);
      }
    );
  });
};

const updateAdmin = (adminId, email, full_name, role_id, status) => {
  return new Promise((resolve, reject) => {
    db.query(
      `UPDATE admins 
       SET email = ?, full_name = ?, role_id = ?, status = ?
       WHERE admin_id = ?`,
      [email, full_name, role_id, status, adminId],
      (err, results) => {
        if (err) return reject(err);
        resolve(results);
      }
    );
  });
};

const softDeleteAdmin = (adminId) => {
  return new Promise((resolve, reject) => {
    db.query(
      `UPDATE admins 
         SET status = 'deleted', deleted_at = CURRENT_TIMESTAMP 
       WHERE admin_id = ?`,
      [adminId],
      (err, results) => {
        if (err) return reject(err);
        resolve(results);
      }
    );
  });
};

// Get all soft-deleted within last 7 days
const getRecentlyDeletedAdmins = () => {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT admin_id, username, email, full_name, role_id, deleted_at
       FROM admins
       WHERE status = 'deleted'
         AND deleted_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       ORDER BY deleted_at DESC`,
      (err, results) => {
        if (err) return reject(err);
        resolve(results);
      }
    );
  });
};

// Restore an admin
const restoreAdmin = (adminId) => {
  return new Promise((resolve, reject) => {
    db.query(
      `UPDATE admins 
         SET status = 'active', deleted_at = NULL 
       WHERE admin_id = ?`,
      [adminId],
      (err, results) => {
        if (err) return reject(err);
        resolve(results);
      }
    );
  });
};

const getAdminByEmail = (email) => {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT * FROM admins WHERE email = ?",
      [email],
      (err, results) => {
        if (err) return reject(err);
        resolve(results);
      }
    );
  });
};

// Fetch a single admin by ID
const getAdminById = (adminId) =>
  new Promise((resolve, reject) => {
    db.query(
      "SELECT * FROM admins WHERE admin_id = ?",
      [adminId],
      (err, results) => {
        if (err) return reject(err);
        resolve(results);
      }
    );
  });

// Check for existing email on any other admin
const getAdminByEmailExcludingId = (email, adminId) =>
  new Promise((resolve, reject) => {
    db.query(
      "SELECT * FROM admins WHERE email = ? AND admin_id != ?",
      [email, adminId],
      (err, results) => {
        if (err) return reject(err);
        resolve(results);
      }
    );
  });

//above new, remamber to add into exports

// Folder Functions
const createFolder = (folder_name, path, extension_id, created_by) => {
  const stmt = db.prepare(
    `INSERT INTO folders (folder_name, path, extension_id, created_by) 
     VALUES (?, ?, ?, ?)`
  );
  stmt.execute([folder_name, path, extension_id, created_by]);
};

// new for folders start

// 1.1 Fetch parent folders
function getFolderCategories(callback) {
  pool.query(
    "SELECT category_id, category_name FROM folder_categories",
    (err, results) => callback(err, results)
  );
}

// 1.2 Fetch extensions for a parent folder
function getFolderExtensions(categoryId, callback) {
  pool.query(
    "SELECT extension_id, extension_name FROM folder_extensions WHERE category_id = ?",
    [categoryId],
    (err, results) => callback(err, results)
  );
}

// 1.3 Ensure directory tree exists
function ensureFolders(
  { baseDir, categoryName, extensionName, subject, itemTitle },
  callback
) {
  const p = (...segments) => path.join(baseDir, ...segments);
  const dirs = [
    p(categoryName),
    p(categoryName, extensionName),
    p(categoryName, extensionName, subject),
    p(categoryName, extensionName, subject, itemTitle),
  ];

  try {
    dirs.forEach((dir) => {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });
    callback(null, p(categoryName, extensionName, subject, itemTitle));
  } catch (err) {
    callback(err);
  }
}

// new for folders end

// get types (new)

// ─── INFORMATION TYPES ─────────────────────────────────────────────────────
function getInformationTypes(callback) {
  db.query("SELECT * FROM information_types", (err, results) => {
    if (err) {
      console.error("[Backend] Error fetching information types:", err);
      return callback(err);
    }
    callback(null, results);
  });
}

// ─── PARTNER TYPES ─────────────────────────────────────────────────────────
function getPartnerTypes(callback) {
  db.query("SELECT * FROM partner_types", (err, results) => {
    if (err) {
      console.error("[Backend] Error fetching partner types:", err);
      return callback(err);
    }
    callback(null, results);
  });
}

// above (new)

// Media Functions
const addImage = (
  image_name,
  description,
  file_path,
  folder_id,
  uploaded_by
) => {
  const stmt = db.prepare(
    `INSERT INTO images (image_name, description, file_path, folder_id, uploaded_by) 
     VALUES (?, ?, ?, ?, ?)`
  );
  stmt.execute([image_name, description, file_path, folder_id, uploaded_by]);
};

const addVideo = (
  video_name,
  description,
  file_path,
  folder_id,
  type_id,
  duration,
  uploaded_by
) => {
  const stmt = db.query(
    `INSERT INTO videos (video_name, description, file_path, folder_id, type_id, duration, uploaded_by) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  stmt.execute([
    video_name,
    description,
    file_path,
    folder_id,
    type_id,
    duration,
    uploaded_by,
  ]);
};

// News Functions
const addNews = (topic, detail_id, publish_time, is_breaking, created_by) => {
  const stmt = db.query(
    `INSERT INTO news (topic, detail_id, publish_time, is_breaking, created_by) 
     VALUES (?, ?, ?, ?, ?)`
  );
  stmt.execute([topic, detail_id, publish_time, is_breaking, created_by]);
};

// Partner Functions
const addPartner = (
  partner_name,
  type_id,
  description,
  contact_email,
  contact_phone,
  website_url,
  logo_image_id,
  created_by
) => {
  const stmt = db.query(
    `INSERT INTO partners (partner_name, type_id, description, contact_email, contact_phone, website_url, logo_image_id, created_by) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );
  stmt.execute([
    partner_name,
    type_id,
    description,
    contact_email,
    contact_phone,
    website_url,
    logo_image_id,
    created_by,
  ]);
};

// Stream Functions
const startStream = (
  stream_title,
  description,
  scheduled_start,
  created_by
) => {
  const stmt = db.query(
    `INSERT INTO streams (stream_title, description, scheduled_start, created_by) 
     VALUES (?, ?, ?, ?)`
  );
  stmt.execute([stream_title, description, scheduled_start, created_by]);
};

// Update Functions
const updateAdminStatus = (admin_id, status) => {
  const stmt = db.query(`UPDATE admins SET status = ? WHERE admin_id = ?`);
  stmt.execute([status, admin_id]);
};

const updateNews = (news_id, topic, is_breaking) => {
  const stmt = db.query(
    `UPDATE news SET topic = ?, is_breaking = ? WHERE news_id = ?`
  );
  stmt.execute([topic, is_breaking, news_id]);
};

// Delete Functions
const deleteAdmin = (admin_id) => {
  const stmt = db.query(
    `UPDATE admins SET status = 'deleted' WHERE admin_id = ?`
  );
  stmt.execute([admin_id]);
};

const removeNews = (news_id) => {
  const stmt = db.query(`DELETE FROM news WHERE news_id = ?`);
  stmt.execute([news_id]);
};

// Relationship Management
const linkNewsImage = (news_id, image_id, display_order = 0) => {
  const stmt = db.query(
    `INSERT INTO news_images (news_id, image_id, display_order) 
     VALUES (?, ?, ?)`
  );
  stmt.execute([news_id, image_id, display_order]);
};

// New down
const { Document, Packer, Paragraph, TextRun } = require("docx");
const fs = require("fs");
const path = require("path");

async function createContentDetailWithDocx(title, content, adminId) {
  return new Promise((resolve, reject) => {
    const now = new Date();
    const codeName = `${now.getFullYear()}${(now.getMonth() + 1)
      .toString()
      .padStart(2, "0")}${now
      .getDate()
      .toString()
      .padStart(2, "0")}_${title.replace(/\s+/g, "_")}`;

    // 1) Determine folder hierarchy from information_types / extensions
    // For "Documents" category, assuming category_id=3
    db.query(
      `SELECT fe1.extension_name AS level1, fe2.extension_name AS level2
       FROM folder_categories fc
       JOIN folder_extensions fe1 ON fe1.category_id = fc.category_id AND fe1.parent_extension_id IS NULL AND fc.category_name='Documents'
       LEFT JOIN folder_extensions fe2 ON fe2.parent_extension_id=fe1.extension_id
       LIMIT 1`,
      (err, levels) => {
        if (err) return reject(err);
        const lvl = levels[0] || {};
        const folderPath = [`Documents`, lvl.level1, lvl.level2]
          .filter(Boolean)
          .join("/");
        const folderName = `${codeName}.docx`;

        // 2) Insert into folders table
        db.query(
          `INSERT INTO folders (folder_name, path, extension_id, created_by)
           VALUES (?, ?, (SELECT extension_id FROM folder_extensions WHERE extension_name=? LIMIT 1), ?)`,
          [folderName, folderPath, lvl.level2 || lvl.level1, adminId],
          (err2, result) => {
            if (err2) return reject(err2);
            const folderId = result.insertId;

            // 3) Insert into content_details
            db.query(
              `INSERT INTO content_details (code_name, folder_id, created_by)
               VALUES (?, ?, ?)`,
              [codeName, folderId, adminId],
              (err3) => {
                if (err3) return reject(err3);

                // 4) Create docx file on disk
                const baseDir = path.join(__dirname, "uploads", folderPath);
                if (!fs.existsSync(baseDir))
                  fs.mkdirSync(baseDir, { recursive: true });
                const filePath = path.join(baseDir, folderName);

                const doc = new Document({
                  sections: [
                    {
                      children: [new Paragraph(title), new Paragraph(content)],
                    },
                  ],
                });
                Packer.toBuffer(doc)
                  .then((buffer) => {
                    fs.writeFileSync(filePath, buffer);
                    resolve();
                  })
                  .catch(reject);
              }
            );
          }
        );
      }
    );
  });
}

// fetch all content_details with folder path for listing
function getContentDetails(callback) {
  const sql = `
    SELECT cd.detail_id, cd.code_name, cd.created_at,
           f.path AS folder_path
    FROM content_details cd
    JOIN folders f ON cd.folder_id = f.folder_id
    ORDER BY cd.created_at DESC
  `;
  db.query(sql, (err, rows) => {
    if (err) {
      console.error("Error fetching content_details:", err);
      return callback(err);
    }
    callback(null, rows);
  });
}

// delete content_details and its folder record
function deleteContentDetail(detailId, callback) {
  // 1) fetch folder path & name
  db.query(
    "SELECT f.`path` AS folder_path, f.folder_name FROM folders f JOIN content_details cd ON cd.folder_id = f.folder_id WHERE cd.detail_id = ?",
    [detailId],
    (err, rows) => {
      if (err) {
        console.error("Error fetching folder for delete:", err);
        return callback(err);
      }
      if (!rows.length) return callback(new Error("No record found"));

      const folderPath = rows[0].folder_path;
      const folderName = rows[0].folder_name;
      const fullDir = path.join(__dirname, "uploads", folderPath);
      const fullFile = path.join(fullDir, folderName);

      // delete physical file
      fs.unlink(fullFile, (unlinkErr) => {
        if (unlinkErr) console.error("Error deleting file:", unlinkErr);
        // 2) delete DB records
        const delSql = `
          DELETE cd, f
          FROM content_details cd
          JOIN folders f ON cd.folder_id = f.folder_id
          WHERE cd.detail_id = ?
        `;
        db.query(delSql, [detailId], (delErr) => {
          if (delErr) console.error("Error deleting DB record:", delErr);
          callback(delErr);
        });
      });
    }
  );
}

// Fetch a single content detail by ID (with folder metadata)
function getContentDetailById(detailId, callback) {
  const sql = `
    SELECT cd.detail_id, cd.code_name, cd.created_at, cd.updated_at,
           f.folder_name, f.path AS folder_path
    FROM content_details cd
    JOIN folders f ON cd.folder_id = f.folder_id
    WHERE cd.detail_id = ?
    LIMIT 1
  `;
  db.query(sql, [detailId], (err, results) => {
    if (err) return callback(err);
    if (results.length === 0) return callback(new Error("Not found"));
    callback(null, results[0]);
  });
}
// In backend.js// Add these functions to your backend.js

// Get breaking news
const getBreakingNews = () => {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT n.news_id, n.topic, n.is_breaking, n.publish_time, 
                    cd.code_name, cd.created_at, cd.updated_at
             FROM news n
             JOIN content_details cd ON n.detail_id = cd.detail_id
             WHERE n.is_breaking = 1
             ORDER BY n.publish_time DESC
             LIMIT 1`,
      (err, results) => {
        if (err) return reject(err);
        resolve(results[0]);
      }
    );
  });
};

// Get live streams
const getLiveStreams = () => {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT s.stream_id, s.stream_title, s.description, 
                    s.scheduled_start, s.actual_start, s.end_time,
                    s.status, v.video_name, v.file_path as video_url
             FROM streams s
             LEFT JOIN videos v ON s.video_id = v.video_id
             WHERE s.status = 'live'
             ORDER BY s.scheduled_start DESC
             LIMIT 1`,
      (err, results) => {
        if (err) return reject(err);
        resolve(results);
      }
    );
  });
};

// Get featured sessions (requires speakers table)
const getFeaturedSessions = (limit = 6) => {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT 
          s.session_id,
          s.session_title,
          s.description,
          s.start_time,
          s.end_time,
          s.is_featured,
          sp.speaker_name AS speaker,
          sp.speaker_id,
          sp.institution,
          sp.bio,
          i.file_path AS imageUrl
       FROM sessions s
       JOIN speakers sp ON s.speaker_id = sp.speaker_id
       LEFT JOIN images i ON sp.image_id = i.image_id
       WHERE s.is_featured = 1
       ORDER BY s.start_time
       LIMIT ?`,
      [limit],
      (err, results) => {
        if (err) return reject(err);

        // Calculate day number in JavaScript
        const summitStart = new Date("2025-09-15"); // Adjust to your summit start date
        const formattedResults = results.map((session) => {
          const sessionDate = new Date(session.start_time);
          const day =
            Math.floor((sessionDate - summitStart) / (1000 * 60 * 60 * 24)) + 1;

          return {
            ...session,
            start_time: sessionDate.toISOString(),
            end_time: session.end_time
              ? new Date(session.end_time).toISOString()
              : null,
            day: day,
            category: "General", // Default category
          };
        });

        resolve(formattedResults);
      }
    );
  });
};
async function getSummitCountdown() {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT start_date FROM summits ORDER BY start_date DESC LIMIT 1`,
      (err, results) => {
        if (err) return reject(err);
        const summitDate = results[0]?.start_date || new Date("2025-06-10");
        const now = new Date();
        const diff = summitDate - now;

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        resolve({ days, hours, minutes });
      }
    );
  });
}

async function getNewsArticles(limit = 3, isBreaking = false) {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT * FROM news 
             WHERE is_breaking = ? 
             ORDER BY publish_time DESC 
             LIMIT ?`,
      [isBreaking ? 1 : 0, limit],
      (err, results) => {
        if (err) return reject(err);
        resolve(results);
      }
    );
  });
}
const getAchievementCards = async () => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        card_id,
        title,
        description,
        image_url,
        stat_text,
        display_order
      FROM achievement_cards
      ORDER BY display_order ASC
    `;

    db.query(query, (err, results) => {
      if (err) return reject(err);

      // Format the results into card objects
      const cards = results.map((card) => ({
        id: card.card_id,
        title: card.title,
        description: card.description,
        imageUrl: card.image_url,
        statText: card.stat_text,
        order: card.display_order,
      }));

      resolve(cards);
    });
  });
};
const getPartnersByType = async () => {
  return new Promise((resolve, reject) => {
    // Check if 'status' column exists in 'partners'
    const checkStatusQuery = `
            SELECT COUNT(*) AS column_exists
            FROM information_schema.columns
            WHERE table_name = 'partners' AND column_name = 'status'
        `;

    // Check if 'display_order' column exists in 'partner_types'
    const checkDisplayOrderQuery = `
            SELECT COUNT(*) AS column_exists
            FROM information_schema.columns
            WHERE table_name = 'partner_types' AND column_name = 'display_order'
        `;

    // Run both checks in parallel
    db.query(checkStatusQuery, (statusErr, statusResults) => {
      if (statusErr) return reject(statusErr);

      const hasStatusColumn = statusResults[0].column_exists > 0;

      db.query(checkDisplayOrderQuery, (orderErr, orderResults) => {
        if (orderErr) return reject(orderErr);

        const hasDisplayOrderColumn = orderResults[0].column_exists > 0;

        // Build the main query dynamically
        const mainQuery = `
                    SELECT pt.type_id, pt.type_name, pt.description AS type_description,
                           p.partner_id, p.partner_name, p.description, 
                           p.contact_email, p.website_url,
                           i.file_path AS logo_path
                    FROM partner_types pt
                    LEFT JOIN partners p ON pt.type_id = p.type_id
                    LEFT JOIN images i ON p.logo_image_id = i.image_id
                    ${hasStatusColumn ? "WHERE p.status = 'active'" : ""}
                    ORDER BY 
                      ${
                        hasDisplayOrderColumn
                          ? "pt.display_order"
                          : "pt.type_name"
                      },
                      p.partner_name
                `;

        db.query(mainQuery, (err, results) => {
          if (err) return reject(err);

          // Group partners by type
          const partnersByType = {};
          results.forEach((row) => {
            if (!partnersByType[row.type_id]) {
              partnersByType[row.type_id] = {
                type_id: row.type_id,
                type_name: row.type_name,
                type_description: row.type_description,
                partners: [],
              };
            }

            if (row.partner_id) {
              partnersByType[row.type_id].partners.push({
                partner_id: row.partner_id,
                partner_name: row.partner_name,
                description: row.description,
                contact_email: row.contact_email,
                website_url: row.website_url,
                logo_path: row.logo_path,
              });
            }
          });

          resolve(Object.values(partnersByType));
        });
      });
    });
  });
};
// backend.js - Add these functions

// Get next upcoming session
const getNextSession = (callback) => {
  const now = new Date();
  const query = `
    SELECT 
      s.session_id, s.session_title, s.description,
      s.start_time, s.end_time, s.is_featured,
      sp.speaker_name, sp.institution, sp.bio,
      i.file_path AS speaker_image
    FROM sessions s
    JOIN speakers sp ON s.speaker_id = sp.speaker_id
    LEFT JOIN images i ON sp.image_id = i.image_id
    WHERE s.start_time > ?
    ORDER BY s.start_time ASC
    LIMIT 1`;

  db.query(query, [now], (err, results) => {
    if (err) return callback(err);
    callback(null, results[0] || null);
  });
};

// Get all upcoming sessions (for fallback)
const getUpcomingSessions = (limit, callback) => {
  const now = new Date();
  const query = `
    SELECT 
      s.*, 
      sp.speaker_name, 
      sp.institution,
      i.file_path AS speaker_image
    FROM sessions s
    JOIN speakers sp ON s.speaker_id = sp.speaker_id
    LEFT JOIN images i ON sp.image_id = i.image_id
    WHERE s.start_time > ?
    ORDER BY s.start_time ASC
    LIMIT ?`;

  db.query(query, [now, limit], (err, results) => {
    if (err) return callback(err);
    callback(null, results);
  });
};
const getTestimonials = async () => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        testimonial_id,
        quote,
        author_name,
        author_title,
        author_affiliation,
        author_image_url,
        created_at,
        updated_at
      FROM testimonials
      ORDER BY created_at DESC
    `;

    db.query(query, (err, results) => {
      if (err) return reject(err);

      // Format the results into testimonial objects
      const testimonials = results.map((testimonial) => ({
        id: testimonial.testimonial_id,
        quote: testimonial.quote,
        author: {
          name: testimonial.author_name,
          title: testimonial.author_title,
          affiliation: testimonial.author_affiliation,
        },
        imageUrl: testimonial.author_image_url,
        createdAt: testimonial.created_at,
        updatedAt: testimonial.updated_at,
      }));

      resolve(testimonials);
    });
  });
};

// Export all functions
module.exports = {
  addAdmin,
  getAdminByUsername,
  getAdminRole,
  updateLastLogin,
  getAdminRoles,
  getAdmins,
  updateAdmin,
  softDeleteAdmin,
  getRecentlyDeletedAdmins,
  restoreAdmin,
  getAdminByEmail,
  getAdminById,
  getAdminByEmailExcludingId,
  createFolder,
  getFolderCategories,
  getFolderExtensions,
  ensureFolders,
  getInformationTypes,
  getPartnerTypes,
  addImage,
  addVideo,
  addNews,
  addPartner,
  startStream,
  updateAdminStatus,
  updateNews,
  deleteAdmin,
  removeNews,
  linkNewsImage,
  createContentDetailWithDocx,
  getContentDetails,
  deleteContentDetail,
  getContentDetailById,

  //sdv
  getBreakingNews,
  getLiveStreams,
  getFeaturedSessions,
  getSummitCountdown,
  getNewsArticles,
  getPartnersByType,
  getNextSession,
  getUpcomingSessions,
  getAchievementCards,
  getTestimonials,
};
