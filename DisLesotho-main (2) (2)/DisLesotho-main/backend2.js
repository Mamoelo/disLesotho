const express = require("express");
const mysql = require("mysql2");
const path = require("path");
const fs = require("fs");
const router = express.Router();
require("dotenv").config();

// Database connection setup (shared with admin backend)
const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "123456",
  database: process.env.DB_DATABASE || "content_management_system",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Verify database connection
db.getConnection((err, connection) => {
  if (err) {
    console.error("Public backend database connection failed:", err);
  } else {
    console.log("Public backend connected to CMS database");
    connection.release();
  }
});

// ─── NEWS FUNCTIONS ────────────────────────────────────────────────────────

/**
 * Get all published news articles with their images
 * @param {number} limit - Maximum number of articles to return
 * @param {boolean} includeBreaking - Whether to include breaking news
 * @returns {Promise<Array>} Array of news articles
 */

/**
 * Get a single news article by ID with full details
 * @param {number} newsId - ID of the news article
 * @returns {Promise<Object>} News article details
 */
const getNewsArticleById = async (newsId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT n.news_id, n.topic, n.publish_time, n.is_breaking,
             cd.code_name, cd.created_at AS content_created,
             a.full_name AS author_name,
             GROUP_CONCAT(i.file_path ORDER BY ni.display_order) AS image_paths,
             GROUP_CONCAT(i.description ORDER BY ni.display_order) AS image_descriptions
      FROM news n
      LEFT JOIN content_details cd ON n.detail_id = cd.detail_id
      LEFT JOIN admins a ON n.created_by = a.admin_id
      LEFT JOIN news_images ni ON n.news_id = ni.news_id
      LEFT JOIN images i ON ni.image_id = i.image_id
      WHERE n.news_id = ?
      GROUP BY n.news_id`;

    db.query(query, [newsId], (err, results) => {
      if (err) return reject(err);
      if (results.length === 0) return resolve(null);

      const article = results[0];

      // Process image data into array of objects
      const imagePaths = article.image_paths
        ? article.image_paths.split(",")
        : [];
      const imageDescriptions = article.image_descriptions
        ? article.image_descriptions.split(",")
        : [];

      article.images = imagePaths.map((path, index) => ({
        path,
        description: imageDescriptions[index] || "",
      }));

      delete article.image_paths;
      delete article.image_descriptions;

      resolve(article);
    });
  });
};

// Add these to your backend.js

/**
 * Get breaking news (if any exists)
 * @returns {Promise<Object|null>} Breaking news article or null
 */
const getBreakingNews = async () => {
  return new Promise((resolve, reject) => {
    const query = `
            SELECT n.news_id, n.topic, n.publish_time,
                   cd.code_name, cd.created_at AS content_created
            FROM news n
            LEFT JOIN content_details cd ON n.detail_id = cd.detail_id
            WHERE n.is_breaking = 1 AND n.publish_time <= NOW()
            ORDER BY n.publish_time DESC
            LIMIT 1`;

    db.query(query, (err, results) => {
      if (err) return reject(err);
      resolve(results.length > 0 ? results[0] : null);
    });
  });
};

/**
 * Get current or upcoming live streams
 * @returns {Promise<Array>} Array of live streams
 */
const getLiveStreams = async () => {
  return new Promise((resolve, reject) => {
    const query = `
            SELECT s.stream_id, s.stream_title, s.description, 
                   s.scheduled_start, s.actual_start, s.actual_end,
                   a.full_name AS created_by,
                   CASE 
                     WHEN s.actual_start IS NOT NULL AND s.actual_end IS NULL THEN 'live'
                     WHEN s.actual_start IS NULL AND s.scheduled_start > NOW() THEN 'upcoming'
                     ELSE 'ended'
                   END AS status
            FROM streams s
            LEFT JOIN admins a ON s.created_by = a.admin_id
            WHERE s.scheduled_start >= DATE_SUB(NOW(), INTERVAL 1 DAY)
            ORDER BY 
              CASE 
                WHEN status = 'live' THEN 0
                WHEN status = 'upcoming' THEN 1
                ELSE 2
              END,
              s.scheduled_start ASC`;

    db.query(query, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

/**
 * Get featured sessions/speakers for the summit
 * @param {number} limit - Maximum number of sessions to return
 * @returns {Promise<Array>} Array of featured sessions
 */
const getFeaturedSessions = async (limit = 3) => {
  return new Promise((resolve, reject) => {
    const query = `
            SELECT s.session_id, s.session_title, s.description, 
                   s.start_time, s.end_time, s.is_featured,
                   sp.speaker_name, sp.title AS speaker_title, 
                   sp.organization AS speaker_org,
                   i.file_path AS speaker_image,
                   v.file_path AS session_video
            FROM sessions s
            LEFT JOIN speakers sp ON s.speaker_id = sp.speaker_id
            LEFT JOIN images i ON sp.image_id = i.image_id
            LEFT JOIN videos v ON s.video_id = v.video_id
            WHERE s.is_featured = 1 AND s.start_time >= NOW()
            ORDER BY s.start_time ASC
            LIMIT ?`;

    db.query(query, [limit], (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

/**
 * Get countdown information for the main summit event
 * @returns {Promise<Object>} Event details for countdown
 */
const getSummitCountdown = async () => {
  return new Promise((resolve, reject) => {
    const query = `
            SELECT e.event_id, e.event_name, e.start_time, e.end_time,
                   e.location, e.description, 
                   i.file_path AS event_image
            FROM events e
            LEFT JOIN images i ON e.image_id = i.image_id
            WHERE e.is_primary = 1
            LIMIT 1`;

    db.query(query, (err, results) => {
      if (err) return reject(err);
      resolve(results.length > 0 ? results[0] : null);
    });
  });
};

/**
 * Get all partners by type with dynamic status and display_order checks
 * @returns {Promise<Object>} Partners grouped by type
 */
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

/**
 * Get all published news articles with their images
 * @param {number} limit - Maximum number of articles to return
 * @param {boolean} includeBreaking - Whether to include breaking news
 * @returns {Promise<Array>} Array of news articles
 */
const getNewsArticles = async (limit = 10, includeBreaking = true) => {
  return new Promise((resolve, reject) => {
    let query = `
            SELECT n.news_id, n.topic, n.publish_time, n.is_breaking,
                   cd.code_name, cd.created_at AS content_created,
                   GROUP_CONCAT(i.file_path ORDER BY ni.display_order) AS image_paths
            FROM news n
            LEFT JOIN content_details cd ON n.detail_id = cd.detail_id
            LEFT JOIN news_images ni ON n.news_id = ni.news_id
            LEFT JOIN images i ON ni.image_id = i.image_id
            WHERE n.publish_time <= NOW()`;

    if (!includeBreaking) {
      query += " AND n.is_breaking = 0";
    }

    query += `
            GROUP BY n.news_id
            ORDER BY n.is_breaking DESC, n.publish_time DESC
            LIMIT ?`;

    db.query(query, [limit], (err, results) => {
      if (err) return reject(err);

      // Process results to split image paths into arrays
      const processed = results.map((article) => ({
        ...article,
        image_paths: article.image_paths ? article.image_paths.split(",") : [],
      }));

      resolve(processed);
    });
  });
};
// ─── CONTENT FUNCTIONS ─────────────────────────────────────────────────────

/**
 * Get content from a specific folder
 * @param {string} folderPath - Path to the folder
 * @returns {Promise<Array>} Array of content items
 */
const getFolderContent = async (folderPath) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT f.folder_id, f.folder_name, f.path,
             cd.detail_id, cd.code_name, cd.created_at,
             i.image_id, i.image_name, i.file_path AS image_path,
             v.video_id, v.video_name, v.file_path AS video_path
      FROM folders f
      LEFT JOIN content_details cd ON f.folder_id = cd.folder_id
      LEFT JOIN images i ON f.folder_id = i.folder_id
      LEFT JOIN videos v ON f.folder_id = v.folder_id
      WHERE f.path = ?`;

    db.query(query, [folderPath], (err, results) => {
      if (err) return reject(err);

      // Organize results by content type
      const content = {
        details: [],
        images: [],
        videos: [],
      };

      results.forEach((row) => {
        if (
          row.detail_id &&
          !content.details.some((d) => d.detail_id === row.detail_id)
        ) {
          content.details.push({
            detail_id: row.detail_id,
            code_name: row.code_name,
            created_at: row.created_at,
          });
        }

        if (row.image_id) {
          content.images.push({
            image_id: row.image_id,
            image_name: row.image_name,
            file_path: row.image_path,
          });
        }

        if (row.video_id) {
          content.videos.push({
            video_id: row.video_id,
            video_name: row.video_name,
            file_path: row.video_path,
          });
        }
      });

      resolve(content);
    });
  });
};

/**
 * Get content detail by ID
 * @param {number} detailId - Content detail ID
 * @returns {Promise<Object>} Content detail with associated files
 */
const getContentDetail = async (detailId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT cd.detail_id, cd.code_name, cd.created_at, cd.updated_at,
             f.folder_id, f.folder_name, f.path,
             i.image_id, i.image_name, i.file_path AS image_path,
             v.video_id, v.video_name, v.file_path AS video_path
      FROM content_details cd
      JOIN folders f ON cd.folder_id = f.folder_id
      LEFT JOIN images i ON f.folder_id = i.folder_id
      LEFT JOIN videos v ON f.folder_id = v.folder_id
      WHERE cd.detail_id = ?`;

    db.query(query, [detailId], (err, results) => {
      if (err) return reject(err);
      if (results.length === 0) return resolve(null);

      const content = {
        detail_id: results[0].detail_id,
        code_name: results[0].code_name,
        created_at: results[0].created_at,
        updated_at: results[0].updated_at,
        folder: {
          folder_id: results[0].folder_id,
          folder_name: results[0].folder_name,
          path: results[0].path,
        },
        images: [],
        videos: [],
      };

      results.forEach((row) => {
        if (
          row.image_id &&
          !content.images.some((img) => img.image_id === row.image_id)
        ) {
          content.images.push({
            image_id: row.image_id,
            image_name: row.image_name,
            file_path: row.image_path,
          });
        }

        if (
          row.video_id &&
          !content.videos.some((vid) => vid.video_id === row.video_id)
        ) {
          content.videos.push({
            video_id: row.video_id,
            video_name: row.video_name,
            file_path: row.video_path,
          });
        }
      });

      resolve(content);
    });
  });
};

// ─── FILE DELIVERY ─────────────────────────────────────────────────────────

/**
 * Serve a file from the protected uploads directory
 * @param {string} filePath - Relative path to the file
 * @param {Response} res - Express response object
 */
const serveProtectedFile = (filePath, res) => {
  const fullPath = path.join(__dirname, "uploads", filePath);

  fs.access(fullPath, fs.constants.R_OK, (err) => {
    if (err) {
      console.error("File access error:", err);
      return res.status(404).send("File not found");
    }

    // Set appropriate headers based on file type
    const ext = path.extname(fullPath).toLowerCase();
    let contentType = "application/octet-stream";

    if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
    else if (ext === ".png") contentType = "image/png";
    else if (ext === ".gif") contentType = "image/gif";
    else if (ext === ".mp4") contentType = "video/mp4";
    else if (ext === ".pdf") contentType = "application/pdf";
    else if (ext === ".docx")
      contentType =
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    res.setHeader("Content-Type", contentType);
    res.sendFile(fullPath);
  });
};

// ─── EXPORTS ───────────────────────────────────────────────────────────────

module.exports = {
  // News functions
  getNewsArticles,
  getNewsArticleById,
  getBreakingNews,

  // Event functions
  getLiveStreams,
  getFeaturedSessions,
  getSummitCountdown,

  // Partner functions (updated)
  getPartnersByType,

  // Content functions
  getFolderContent,
  getContentDetail,

  // File delivery
  serveProtectedFile,

  // Database connection for direct querying if needed
  db,
};
