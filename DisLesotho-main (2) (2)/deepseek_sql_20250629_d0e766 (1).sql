-- Create the database
CREATE DATABASE IF NOT EXISTS `content_management_system`;
USE `content_management_system`;

-- Table structure for table `admin_roles`
CREATE TABLE `admin_roles` (
  `role_id` int NOT NULL AUTO_INCREMENT,
  `role_name` varchar(50) NOT NULL,
  `can_add_content` tinyint(1) NOT NULL DEFAULT '0',
  `can_remove_content` tinyint(1) NOT NULL DEFAULT '0',
  `can_start_stream` tinyint(1) NOT NULL DEFAULT '0',
  `can_set_schedule` tinyint(1) NOT NULL DEFAULT '0',
  `can_manage_users` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`role_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table `admin_roles`
INSERT INTO `admin_roles` (`role_id`, `role_name`, `can_add_content`, `can_remove_content`, `can_start_stream`, `can_set_schedule`, `can_manage_users`) VALUES
(1, 'Super Admin', 1, 1, 1, 1, 1),
(2, 'Head Manager', 1, 1, 1, 1, 0),
(3, 'Content Manager', 1, 1, 0, 1, 0),
(4, 'Stream Manager', 0, 0, 1, 1, 0);

-- Table structure for table `admins`
CREATE TABLE `admins` (
  `admin_id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `email` varchar(100) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `is_super_admin` tinyint(1) NOT NULL DEFAULT '0',
  `role_id` int DEFAULT NULL,
  `status` enum('active','inactive','suspended') NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_login` datetime DEFAULT NULL,
  PRIMARY KEY (`admin_id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `admins_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `admin_roles` (`role_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table `admins`
INSERT INTO `admins` (`admin_id`, `username`, `password_hash`, `email`, `full_name`, `is_super_admin`, `role_id`, `status`, `created_at`, `last_login`) VALUES
(1, 'superadmin', 'hashed_password_here', 'admin@example.com', 'Super Administrator', 1, 1, 'active', '2025-06-19 09:29:19', NULL),
(2, 'event_manager', 'hashed_password_123', 'manager@summit.org', 'Event Manager', 0, 2, 'active', '2025-06-19 12:32:44', NULL),
(3, 'content_admin', 'hashed_password_456', 'content@summit.org', 'Content Administrator', 0, 3, 'active', '2025-06-19 12:32:44', NULL);

-- Table structure for table `folder_categories`
CREATE TABLE `folder_categories` (
  `category_id` int NOT NULL AUTO_INCREMENT,
  `category_name` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`category_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table `folder_categories`
INSERT INTO `folder_categories` (`category_id`, `category_name`, `description`) VALUES
(1, 'Media Files', 'General media folders'),
(2, 'Documents', 'PDFs, Word docs, and presentations'),
(3, 'Images', 'Photographs and graphics');

-- Table structure for table `folder_extensions`
CREATE TABLE `folder_extensions` (
  `extension_id` int NOT NULL AUTO_INCREMENT,
  `extension_name` varchar(50) NOT NULL,
  `parent_extension_id` int DEFAULT NULL,
  `category_id` int NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`extension_id`),
  KEY `category_id` (`category_id`),
  CONSTRAINT `folder_extensions_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `folder_categories` (`category_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table `folder_extensions`
INSERT INTO `folder_extensions` (`extension_id`, `extension_name`, `parent_extension_id`, `category_id`, `description`) VALUES
(1, 'Videos', NULL, 1, 'Folder for storing videos'),
(2, 'PDFs', NULL, 2, 'Folder for PDF documents'),
(3, 'Presentations', NULL, 2, 'Folder for slide decks'),
(4, 'Photographs', NULL, 3, 'High resolution event photos'),
(5, 'Graphics', NULL, 3, 'Logos and design assets');

-- Table structure for table `folders`
CREATE TABLE `folders` (
  `folder_id` int NOT NULL AUTO_INCREMENT,
  `folder_name` varchar(100) NOT NULL,
  `path` varchar(255) NOT NULL,
  `extension_id` int NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` int NOT NULL,
  PRIMARY KEY (`folder_id`),
  KEY `extension_id` (`extension_id`),
  CONSTRAINT `folders_ibfk_1` FOREIGN KEY (`extension_id`) REFERENCES `folder_extensions` (`extension_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table `folders`
INSERT INTO `folders` (`folder_id`, `folder_name`, `path`, `extension_id`, `created_at`, `created_by`) VALUES
(1, 'Main Video Folder', '/media/videos/', 1, '2025-06-19 09:29:19', 1),
(2, 'Speaker Presentations', '/documents/presentations/', 3, '2025-06-19 12:32:44', 1),
(3, 'Event Photos 2025', '/images/photographs/', 4, '2025-06-19 12:32:44', 2),
(4, 'Brand Assets', '/images/graphics/', 5, '2025-06-19 12:32:44', 3);

-- Table structure for table `content_details`
CREATE TABLE `content_details` (
  `detail_id` int NOT NULL AUTO_INCREMENT,
  `code_name` varchar(50) NOT NULL,
  `folder_id` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  `created_by` int NOT NULL,
  PRIMARY KEY (`detail_id`),
  KEY `folder_id` (`folder_id`),
  CONSTRAINT `content_details_ibfk_1` FOREIGN KEY (`folder_id`) REFERENCES `folders` (`folder_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table `content_details`
INSERT INTO `content_details` (`detail_id`, `code_name`, `folder_id`, `created_at`, `updated_at`, `created_by`) VALUES
(1, 'WelcomeContent', 1, '2025-06-19 09:29:19', NULL, 1),
(2, 'SpeakerMaterials', 2, '2025-06-19 12:32:45', NULL, 2),
(3, 'MediaKit2025', 3, '2025-06-19 12:32:45', NULL, 3),
(4, 'SponsorAssets', 4, '2025-06-19 12:32:45', NULL, 1);

-- Table structure for table `images`
CREATE TABLE `images` (
  `image_id` int NOT NULL AUTO_INCREMENT,
  `image_name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `file_path` varchar(255) NOT NULL,
  `folder_id` int NOT NULL,
  `uploaded_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `uploaded_by` int NOT NULL,
  PRIMARY KEY (`image_id`),
  KEY `folder_id` (`folder_id`),
  CONSTRAINT `images_ibfk_1` FOREIGN KEY (`folder_id`) REFERENCES `folders` (`folder_id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table `images`
INSERT INTO `images` (`image_id`, `image_name`, `description`, `file_path`, `folder_id`, `uploaded_at`, `uploaded_by`) VALUES
(1, 'Sample Logo', 'Logo for partner', 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/1024px-React-icon.svg.png', 1, '2025-06-19 09:29:19', 1),
(2, 'Speaker Portrait', 'Keynote speaker headshot', 'https://example.com/speaker1.jpg', 3, '2025-06-19 12:32:45', 1),
(3, 'Event Banner', 'Main summit banner design', 'https://example.com/banner2025.png', 3, '2025-06-19 12:32:45', 2),
(4, 'Sponsor Logo', 'Platinum sponsor logo', 'https://example.com/sponsor_logo.png', 3, '2025-06-19 12:32:45', 1),
(5, 'NUL Logo', 'National University of Lesotho logo', 'https://mamoelo.github.io/disLesotho/images/logos/NUL_LOGO.png', 4, '2025-06-24 17:39:37', 1),
(6, 'LRA Logo', 'Lesotho Revenue Authority logo', 'https://mamoelo.github.io/disLesotho/images/logos/revenue-services-lesotho.png', 4, '2025-06-24 17:39:37', 1),
(7, 'American Corner Logo', 'American Corner Maseru logo', 'https://mamoelo.github.io/disLesotho/images/logos/american-corner.png', 4, '2025-06-24 17:39:37', 1),
(8, 'Botho University Logo', 'Botho University logo', 'https://mamoelo.github.io/disLesotho/images/logos/botho%20uni.avif', 4, '2025-06-24 17:39:37', 1),
(9, 'LUCT Logo', 'Limkokwing University of Creative Technology logo', 'https://mamoelo.github.io/disLesotho/images/logos/luct%20logo.webp', 4, '2025-06-24 17:39:37', 1),
(10, 'Hollard Logo', 'Hollard Lesotho insurance logo', 'https://mamoelo.github.io/disLesotho/images/logos/lnig-hollard-logo.png', 4, '2025-06-24 17:39:37', 1),
(11, 'NUL Logo', 'National University of Lesotho logo', 'https://mamoelo.github.io/disLesotho/images/logos/NUL_LOGO.png', 4, '2025-06-24 17:42:01', 1),
(12, 'LRA Logo', 'Lesotho Revenue Authority logo', 'https://mamoelo.github.io/disLesotho/images/logos/revenue-services-lesotho.png', 4, '2025-06-24 17:42:01', 1),
(13, 'American Corner Logo', 'American Corner Maseru logo', 'https://mamoelo.github.io/disLesotho/images/logos/american-corner.png', 4, '2025-06-24 17:42:01', 1),
(14, 'Botho University Logo', 'Botho University logo', 'https://mamoelo.github.io/disLesotho/images/logos/botho%20uni.avif', 4, '2025-06-24 17:42:01', 1),
(15, 'LUCT Logo', 'Limkokwing University of Creative Technology logo', 'https://mamoelo.github.io/disLesotho/images/logos/luct%20logo.webp', 4, '2025-06-24 17:42:01', 1),
(16, 'Hollard Logo', 'Hollard Lesotho insurance logo', 'https://mamoelo.github.io/disLesotho/images/logos/lnig-hollard-logo.png', 4, '2025-06-24 17:42:01', 1);

-- Table structure for table `video_types`
CREATE TABLE `video_types` (
  `type_id` int NOT NULL AUTO_INCREMENT,
  `type_name` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`type_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table `video_types`
INSERT INTO `video_types` (`type_id`, `type_name`, `description`) VALUES
(1, 'Stream', 'Live stream content'),
(2, 'Short Form', 'Short videos under 1 minute'),
(3, 'Long Form', 'Longer videos over 1 minute');

-- Table structure for table `videos`
CREATE TABLE `videos` (
  `video_id` int NOT NULL AUTO_INCREMENT,
  `video_name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `file_path` varchar(255) NOT NULL,
  `folder_id` int NOT NULL,
  `type_id` int NOT NULL,
  `duration` int DEFAULT NULL COMMENT 'in seconds',
  `uploaded_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `uploaded_by` int NOT NULL,
  PRIMARY KEY (`video_id`),
  KEY `folder_id` (`folder_id`),
  KEY `type_id` (`type_id`),
  CONSTRAINT `videos_ibfk_1` FOREIGN KEY (`folder_id`) REFERENCES `folders` (`folder_id`),
  CONSTRAINT `videos_ibfk_2` FOREIGN KEY (`type_id`) REFERENCES `video_types` (`type_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table `videos`
INSERT INTO `videos` (`video_id`, `video_name`, `description`, `file_path`, `folder_id`, `type_id`, `duration`, `uploaded_at`, `uploaded_by`) VALUES
(1, 'Sample Live Stream', 'This is a test live stream.', 'https://youtu.be/9QBHIakvKjo?si=PBTnjIR9wtR3GdJj', 1, 1, 7200, '2025-06-19 09:29:19', 1),
(2, 'Short Demo Clip', 'This is a short form video.', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 1, 2, 45, '2025-06-19 09:29:19', 1),
(3, 'Long Tutorial Video', 'Detailed tutorial session.', 'https://www.youtube.com/watch?v=2OHbjep_WjQ', 1, 3, 3600, '2025-06-19 09:29:19', 1),
(4, 'Opening Keynote', 'Live stream of opening keynote', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 1, 1, 3600, '2025-06-19 12:32:45', 1),
(5, 'Panel Discussion', 'AI future trends panel', 'https://www.youtube.com/watch?v=abcdefghijk', 1, 2, 2700, '2025-06-19 12:32:45', 2),
(6, 'Closing Remarks', 'Summit closing ceremony', 'https://www.youtube.com/watch?v=lmno123456', 1, 1, 1800, '2025-06-19 12:32:45', 1);

-- Table structure for table `summits`
CREATE TABLE `summits` (
  `summit_id` int NOT NULL AUTO_INCREMENT,
  `summit_name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `location` varchar(100) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  `created_by` int NOT NULL,
  PRIMARY KEY (`summit_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table `summits`
INSERT INTO `summits` (`summit_id`, `summit_name`, `description`, `location`, `start_date`, `end_date`, `created_at`, `updated_at`, `created_by`) VALUES
(1, '2025 Global Innovation Summit', 'A gathering of world innovators.', 'Maseru, Lesotho', '2025-09-15', '2025-09-17', '2025-06-19 09:29:19', NULL, 1),
(2, '2024 Tech Innovation Summit', 'Previous year summit', 'Johannesburg', '2024-08-20', '2024-08-22', '2025-06-19 12:32:45', NULL, 1),
(3, '2026 Future Tech Forecast', 'Next year planned summit', 'Cape Town', '2026-10-10', '2026-10-12', '2025-06-19 12:32:45', NULL, 2);

-- Table structure for table `partner_types`
CREATE TABLE `partner_types` (
  `type_id` int NOT NULL AUTO_INCREMENT,
  `type_name` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`type_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table `partner_types`
INSERT INTO `partner_types` (`type_id`, `type_name`, `description`) VALUES
(1, 'Event Host', 'Organization hosting events'),
(2, 'Sponsor', 'Financial supporters of events'),
(3, 'Learning Institute', 'Educational institutions involved');

-- Table structure for table `partners`
CREATE TABLE `partners` (
  `partner_id` int NOT NULL AUTO_INCREMENT,
  `partner_name` varchar(100) NOT NULL,
  `type_id` int NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `contact_email` varchar(100) DEFAULT NULL,
  `contact_phone` varchar(20) DEFAULT NULL,
  `website_url` varchar(255) DEFAULT NULL,
  `logo_image_id` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  `created_by` int NOT NULL,
  PRIMARY KEY (`partner_id`),
  KEY `type_id` (`type_id`),
  KEY `logo_image_id` (`logo_image_id`),
  CONSTRAINT `partners_ibfk_1` FOREIGN KEY (`type_id`) REFERENCES `partner_types` (`type_id`),
  CONSTRAINT `partners_ibfk_2` FOREIGN KEY (`logo_image_id`) REFERENCES `images` (`image_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table `partners`
INSERT INTO `partners` (`partner_id`, `partner_name`, `type_id`, `description`, `contact_email`, `contact_phone`, `website_url`, `logo_image_id`, `created_at`, `updated_at`, `created_by`) VALUES
(1, 'TechSummit Org', 1, 'Leading event organizer', 'contact@techsummit.org', '+123456789', 'https://techsummit.org', 1, '2025-06-19 09:29:19', NULL, 1),
(2, 'National University of Lesotho', 3, 'Premier higher education institution in Lesotho', 'info@nul.ls', '+266 22340601', 'https://www.nul.ls/', 11, '2025-06-24 17:42:01', NULL, 1),
(3, 'American Corner Maseru', 3, 'American cultural center and library', 'americancornermaseru@gmail.com', '+266 22312121', 'https://ls.usembassy.gov/education-culture/american-corner/', 13, '2025-06-24 17:42:01', NULL, 1),
(4, 'Botho University', 3, 'Private university in Lesotho', 'info@bothouniversity.com', '+266 22315656', 'https://www.bothouniversity.com/', 14, '2025-06-24 17:42:01', NULL, 1),
(5, 'Limkokwing University', 3, 'International university with campus in Lesotho', 'enquiry@limkokwing.net', '+266 22317272', 'https://www.limkokwing.net/ls/', 15, '2025-06-24 17:42:01', NULL, 1),
(6, 'Hollard Lesotho', 2, 'Insurance company in Lesotho', 'info@hollard.co.ls', '+266 22310000', 'https://www.hollard.co.ls/', 16, '2025-06-24 17:42:07', NULL, 1);

-- Table structure for table `events`
CREATE TABLE `events` (
  `event_id` int NOT NULL AUTO_INCREMENT,
  `event_name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `location` varchar(100) NOT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime NOT NULL,
  `partner_id` int DEFAULT NULL,
  `cover_image_id` int DEFAULT NULL,
  `detail_id` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  `created_by` int NOT NULL,
  PRIMARY KEY (`event_id`),
  KEY `partner_id` (`partner_id`),
  KEY `cover_image_id` (`cover_image_id`),
  KEY `detail_id` (`detail_id`),
  CONSTRAINT `events_ibfk_1` FOREIGN KEY (`partner_id`) REFERENCES `partners` (`partner_id`),
  CONSTRAINT `events_ibfk_2` FOREIGN KEY (`cover_image_id`) REFERENCES `images` (`image_id`),
  CONSTRAINT `events_ibfk_3` FOREIGN KEY (`detail_id`) REFERENCES `content_details` (`detail_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table `events`
INSERT INTO `events` (`event_id`, `event_name`, `description`, `location`, `start_time`, `end_time`, `partner_id`, `cover_image_id`, `detail_id`, `created_at`, `updated_at`, `created_by`) VALUES
(1, 'Annual Tech Summit', 'The biggest tech summit of the year.', 'Maseru Convention Centre', '2025-09-15 09:00:00', '2025-09-17 18:00:00', 1, 1, 1, '2025-06-19 09:29:19', NULL, 1);

-- Table structure for table `speakers`
CREATE TABLE `speakers` (
  `speaker_id` int NOT NULL AUTO_INCREMENT,
  `speaker_name` varchar(100) NOT NULL,
  `institution` varchar(100) DEFAULT NULL,
  `bio` varchar(255) DEFAULT NULL,
  `image_id` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`speaker_id`),
  KEY `image_id` (`image_id`),
  CONSTRAINT `speakers_ibfk_1` FOREIGN KEY (`image_id`) REFERENCES `images` (`image_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table `speakers`
INSERT INTO `speakers` (`speaker_id`, `speaker_name`, `institution`, `bio`, `image_id`, `created_at`) VALUES
(1, 'Dr. John Doe', 'MIT', 'AI Researcher and keynote speaker.', 1, '2025-06-19 09:29:19'),
(2, 'Dr. Jane Smith', 'Stanford University', 'Renowned computer scientist', 2, '2025-06-19 12:32:45'),
(3, 'Prof. David Lee', 'MIT Media Lab', 'Human-computer interaction expert', 3, '2025-06-19 12:32:45');

-- Table structure for table `sessions`
CREATE TABLE `sessions` (
  `session_id` int NOT NULL AUTO_INCREMENT,
  `session_title` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `speaker_id` int DEFAULT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime NOT NULL,
  `is_featured` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`session_id`),
  KEY `speaker_id` (`speaker_id`),
  CONSTRAINT `sessions_ibfk_1` FOREIGN KEY (`speaker_id`) REFERENCES `speakers` (`speaker_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table `sessions`
INSERT INTO `sessions` (`session_id`, `session_title`, `description`, `speaker_id`, `start_time`, `end_time`, `is_featured`, `created_at`) VALUES
(1, 'AI Breakthroughs: The Next Decade', 'Exploring groundbreaking AI advancements expected in the next 10 years', 1, '2025-06-02 13:01:44', '2025-06-02 14:01:44', 1, '2025-06-19 09:29:19'),
(2, 'Quantum Computing: From Theory to Practice', 'Hands-on look at quantum computing applications', 2, '2025-09-16 11:00:00', '2025-09-16 12:30:00', 1, '2025-06-19 12:32:45'),
(3, 'UX/XR: The Future of Human-Computer Interaction', 'How extended reality is transforming user experiences', 3, '2025-09-17 11:00:00', '2025-09-17 12:30:00', 0, '2025-06-19 12:32:45'),
(4, 'AI Ethics Debate', 'Panel discussion on ethical AI development', 1, '2025-09-15 13:00:00', '2025-09-15 14:30:00', 1, '2025-06-20 18:11:56'),
(5, 'Blockchain Revolution', 'How blockchain is changing industries', 2, '2025-09-16 11:00:00', '2025-09-16 12:30:00', 1, '2025-06-20 18:11:56'),
(6, 'Future of Web Development', 'Emerging trends in web technologies', 3, '2025-09-17 14:00:00', '2025-09-17 15:30:00', 1, '2025-06-20 18:11:56');

-- Table structure for table `streams`
CREATE TABLE `streams` (
  `stream_id` int NOT NULL AUTO_INCREMENT,
  `stream_name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `video_id` int NOT NULL,
  `is_live` tinyint(1) NOT NULL DEFAULT '0',
  `start_time` datetime NOT NULL,
  `end_time` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`stream_id`),
  KEY `video_id` (`video_id`),
  CONSTRAINT `streams_ibfk_1` FOREIGN KEY (`video_id`) REFERENCES `videos` (`video_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table structure for table `information_types`
CREATE TABLE `information_types` (
  `type_id` int NOT NULL AUTO_INCREMENT,
  `type_name` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`type_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table `information_types`
INSERT INTO `information_types` (`type_id`, `type_name`, `description`) VALUES
(1, 'Speaker', 'Information about speakers'),
(2, 'Partner', 'Information about partners'),
(3, 'Event', 'Information about events'),
(4, 'Application Owner', 'Information about the application owners'),
(5, 'Contributor', 'Information about other contributors');

-- Table structure for table `information`
CREATE TABLE `information` (
  `information_id` int NOT NULL AUTO_INCREMENT,
  `about` varchar(255) NOT NULL,
  `detail_id` int DEFAULT NULL,
  `type_id` int NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  `created_by` int NOT NULL,
  PRIMARY KEY (`information_id`),
  KEY `detail_id` (`detail_id`),
  KEY `type_id` (`type_id`),
  CONSTRAINT `information_ibfk_1` FOREIGN KEY (`detail_id`) REFERENCES `content_details` (`detail_id`),
  CONSTRAINT `information_ibfk_2` FOREIGN KEY (`type_id`) REFERENCES `information_types` (`type_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table `information`
INSERT INTO `information` (`information_id`, `about`, `detail_id`, `type_id`, `created_at`, `updated_at`, `created_by`) VALUES
(1, 'About our keynote speaker', 1, 1, '2025-06-19 09:29:19', NULL, 1),
(2, 'Venue information', 2, 2, '2025-06-19 12:32:45', NULL, 2),
(3, 'Transportation options', 3, 3, '2025-06-19 12:32:45', NULL, 1),
(4, 'Accessibility services', 4, 4, '2025-06-19 12:32:45', NULL, 3);

-- Table structure for table `information_images`
CREATE TABLE `information_images` (
  `information_id` int NOT NULL,
  `image_id` int NOT NULL,
  `display_order` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`information_id`,`image_id`),
  KEY `image_id` (`image_id`),
  CONSTRAINT `information_images_ibfk_1` FOREIGN KEY (`information_id`) REFERENCES `information` (`information_id`),
  CONSTRAINT `information_images_ibfk_2` FOREIGN KEY (`image_id`) REFERENCES `images` (`image_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table `information_images`
INSERT INTO `information_images` (`information_id`, `image_id`, `display_order`) VALUES
(1, 1, 1),
(2, 2, 1),
(3, 3, 1);

-- Table structure for table `information_videos`
CREATE TABLE `information_videos` (
  `information_id` int NOT NULL,
  `video_id` int NOT NULL,
  `display_order` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`information_id`,`video_id`),
  KEY `video_id` (`video_id`),
  CONSTRAINT `information_videos_ibfk_1` FOREIGN KEY (`information_id`) REFERENCES `information` (`information_id`),
  CONSTRAINT `information_videos_ibfk_2` FOREIGN KEY (`video_id`) REFERENCES `videos` (`video_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table `information_videos`
INSERT INTO `information_videos` (`information_id`, `video_id`, `display_order`) VALUES
(1, 1, 1),
(2, 2, 1),
(3, 3, 1);

-- Table structure for table `news`
CREATE TABLE `news` (
  `news_id` int NOT NULL AUTO_INCREMENT,
  `topic` varchar(100) NOT NULL,
  `detail_id` int DEFAULT NULL,
  `publish_time` datetime NOT NULL,
  `is_breaking` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  `created_by` int NOT NULL,
  PRIMARY KEY (`news_id`),
  KEY `detail_id` (`detail_id`),
  CONSTRAINT `news_ibfk_1` FOREIGN KEY (`detail_id`) REFERENCES `content_details` (`detail_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table `news`
INSERT INTO `news` (`news_id`, `topic`, `detail_id`, `publish_time`, `is_breaking`, `created_at`, `updated_at`, `created_by`) VALUES
(1, 'New Website Launched', 1, '2025-06-19 09:29:19', 1, '2025-06-19 09:29:19', NULL, 1),
(2, 'Early Bird Registration Open', 1, '2025-06-19 12:32:45', 1, '2025-06-19 12:32:45', NULL, 2),
(3, 'New Keynote Speaker Announced', 2, '2025-06-19 12:32:45', 0, '2025-06-19 12:32:45', NULL, 1),
(4, 'Schedule Now Available', 3, '2025-06-19 12:32:45', 0, '2025-06-19 12:32:45', NULL, 3);

-- Table structure for table `news_images`
CREATE TABLE `news_images` (
  `news_id` int NOT NULL,
  `image_id` int NOT NULL,
  `display_order` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`news_id`,`image_id`),
  KEY `image_id` (`image_id`),
  CONSTRAINT `news_images_ibfk_1` FOREIGN KEY (`news_id`) REFERENCES `news` (`news_id`),
  CONSTRAINT `news_images_ibfk_2` FOREIGN KEY (`image_id`) REFERENCES `images` (`image_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table `news_images`
INSERT INTO `news_images` (`news_id`, `image_id`, `display_order`) VALUES
(1, 1, 1),
(2, 2, 1),
(3, 3, 1);

-- Table structure for table `news_videos`
CREATE TABLE `news_videos` (
  `news_id` int NOT NULL,
  `video_id` int NOT NULL,
  `display_order` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`news_id`,`video_id`),
  KEY `video_id` (`video_id`),
  CONSTRAINT `news_videos_ibfk_1` FOREIGN KEY (`news_id`) REFERENCES `news` (`news_id`),
  CONSTRAINT `news_videos_ibfk_2` FOREIGN KEY (`video_id`) REFERENCES `videos` (`video_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table `news_videos`
INSERT INTO `news_videos` (`news_id`, `video_id`, `display_order`) VALUES
(1, 1, 1),
(2, 2, 1),
(3, 3, 1);

-- Table structure for table `testimonials`
CREATE TABLE `testimonials` (
  `testimonial_id` int NOT NULL AUTO_INCREMENT,
  `quote` text NOT NULL,
  `author_name` varchar(100) NOT NULL,
  `author_title` varchar(100) DEFAULT NULL,
  `author_affiliation` varchar(100) DEFAULT NULL,
  `author_image_url` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  `created_by` int NOT NULL,
  PRIMARY KEY (`testimonial_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table `testimonials`
INSERT INTO `testimonials` (`testimonial_id`, `quote`, `author_name`, `author_title`, `author_affiliation`, `author_image_url`, `created_at`, `updated_at`, `created_by`) VALUES
(1, '\"The summit has been lauded as a cornerstone for digital literacy advancement in Lesotho, earning national awards.\"', 'Participant', 'Summit Attendee', 'NUL Faculty Member', 'https://dislesotho.com/Th19JuneNow/images/people/profile.png', '2025-06-25 19:37:34', NULL, 1),
(2, '\"Journalists and content creators reported improved accuracy and ethical reporting practices post-training.\"', 'Media Professional', 'Media Representative', 'Lesotho Times', 'https://dislesotho.com/Th19JuneNow/images/people/profile.png', '2025-06-25 19:37:34', NULL, 1),
(3, '\"Government and private sector partners now actively support digital transformation policies influenced by summit themes.\"', 'Government Official', 'Government Official', 'MICSTI', 'https://dislesotho.com/Th19JuneNow/images/people/profile.png', '2025-06-25 19:37:34', NULL, 1);

-- Table structure for table `achievement_cards`
CREATE TABLE `achievement_cards` (
  `card_id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(100) NOT NULL,
  `description` text NOT NULL,
  `image_url` varchar(255) NOT NULL,
  `stat_text` varchar(100) DEFAULT NULL,
  `display_order` int DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  `created_by` int NOT NULL,
  PRIMARY KEY (`card_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dumping data for table `achievement_cards`
INSERT INTO `achievement_cards` (`card_id`, `title`, `description`, `image_url`, `stat_text`, `display_order`, `created_at`, `updated_at`, `created_by`) VALUES
(1, 'Summit Impact', 'Engaged 500+ participants from leading universities including NUL, Botho University, and Limkokwing.', 'https://mamoelo.github.io/disLesotho/images/people/bg.jpg', 'Broad Reach', 1, '2025-06-25 08:29:09', NULL, 1),
(2, 'Advocacy Impact', 'Participants have actively led campaigns against misinformation using AI tools from the summit.', 'https://mamoelo.github.io/disLesotho/images/people/bg2.jpg', '30% implemented digital tools', 2, '2025-06-25 08:29:09', NULL, 1),
(3, 'Improved Reporting', 'Enhanced digital reporting practices among participants', 'https://mamoelo.github.io/disLesotho/images/people/bg3.jpg', 'Improved reporting practices', 3, '2025-06-25 08:29:09', NULL, 1);