-- Create the database
CREATE DATABASE IF NOT EXISTS content_management_system;
USE content_management_system;

-- Admin and Manager tables
CREATE TABLE admin_roles (
    role_id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    can_add_content BOOLEAN NOT NULL DEFAULT FALSE,
    can_remove_content BOOLEAN NOT NULL DEFAULT FALSE,
    can_start_stream BOOLEAN NOT NULL DEFAULT FALSE,
    can_set_schedule BOOLEAN NOT NULL DEFAULT FALSE,
    can_manage_users BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE admins (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    is_super_admin BOOLEAN NOT NULL DEFAULT FALSE,
    role_id INT,
    status ENUM('active', 'suspended', 'deleted') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    FOREIGN KEY (role_id) REFERENCES admin_roles(role_id) ON DELETE SET NULL
);

-- Folder structure
CREATE TABLE folder_categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE folder_extensions (
    extension_id INT AUTO_INCREMENT PRIMARY KEY,
    extension_name VARCHAR(100) NOT NULL,
    parent_extension_id INT NULL,
    category_id INT NOT NULL,
    description TEXT,
    FOREIGN KEY (parent_extension_id) REFERENCES folder_extensions(extension_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES folder_categories(category_id) ON DELETE CASCADE,
    UNIQUE KEY (extension_name, category_id)
);

CREATE TABLE folders (
    folder_id INT AUTO_INCREMENT PRIMARY KEY,
    folder_name VARCHAR(100) NOT NULL,
    path VARCHAR(255) NOT NULL,
    extension_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT NOT NULL,
    FOREIGN KEY (extension_id) REFERENCES folder_extensions(extension_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES admins(admin_id) ON DELETE CASCADE
);

-- Media management
CREATE TABLE images (
    image_id INT AUTO_INCREMENT PRIMARY KEY,
    image_name VARCHAR(100) NOT NULL,
    description TEXT,
    file_path VARCHAR(255) NOT NULL,
    folder_id INT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uploaded_by INT NOT NULL,
    FOREIGN KEY (folder_id) REFERENCES folders(folder_id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES admins(admin_id) ON DELETE CASCADE
);

CREATE TABLE video_types (
    type_id INT AUTO_INCREMENT PRIMARY KEY,
    type_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE videos (
    video_id INT AUTO_INCREMENT PRIMARY KEY,
    video_name VARCHAR(100) NOT NULL,
    description TEXT,
    file_path VARCHAR(255) NOT NULL,
    folder_id INT NOT NULL,
    type_id INT NOT NULL,
    duration INT COMMENT 'Duration in seconds',
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uploaded_by INT NOT NULL,
    FOREIGN KEY (folder_id) REFERENCES folders(folder_id) ON DELETE CASCADE,
    FOREIGN KEY (type_id) REFERENCES video_types(type_id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES admins(admin_id) ON DELETE CASCADE
);

-- Content types
CREATE TABLE content_details (
    detail_id INT AUTO_INCREMENT PRIMARY KEY,
    code_name VARCHAR(50) NOT NULL UNIQUE,
    folder_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL,
    created_by INT NOT NULL,
    FOREIGN KEY (folder_id) REFERENCES folders(folder_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES admins(admin_id) ON DELETE CASCADE
);

CREATE TABLE news (
    news_id INT AUTO_INCREMENT PRIMARY KEY,
    topic VARCHAR(255) NOT NULL,
    detail_id INT NOT NULL,
    publish_time DATETIME NOT NULL,
    is_breaking BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL,
    created_by INT NOT NULL,
    FOREIGN KEY (detail_id) REFERENCES content_details(detail_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES admins(admin_id) ON DELETE CASCADE
);

CREATE TABLE information_types (
    type_id INT AUTO_INCREMENT PRIMARY KEY,
    type_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE information (
    information_id INT AUTO_INCREMENT PRIMARY KEY,
    about VARCHAR(255) NOT NULL,
    detail_id INT NOT NULL,
    type_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL,
    created_by INT NOT NULL,
    FOREIGN KEY (detail_id) REFERENCES content_details(detail_id) ON DELETE CASCADE,
    FOREIGN KEY (type_id) REFERENCES information_types(type_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES admins(admin_id) ON DELETE CASCADE
);

-- Partner management
CREATE TABLE partner_types (
    type_id INT AUTO_INCREMENT PRIMARY KEY,
    type_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE partners (
    partner_id INT AUTO_INCREMENT PRIMARY KEY,
    partner_name VARCHAR(100) NOT NULL,
    type_id INT NOT NULL,
    description TEXT,
    contact_email VARCHAR(100),
    contact_phone VARCHAR(20),
    website_url VARCHAR(255),
    logo_image_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL,
    created_by INT NOT NULL,
    FOREIGN KEY (type_id) REFERENCES partner_types(type_id) ON DELETE CASCADE,
    FOREIGN KEY (logo_image_id) REFERENCES images(image_id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES admins(admin_id) ON DELETE CASCADE
);

-- Event management
CREATE TABLE events (
    event_id INT AUTO_INCREMENT PRIMARY KEY,
    event_name VARCHAR(100) NOT NULL,
    description TEXT,
    location VARCHAR(255) NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    partner_id INT,
    cover_image_id INT,
    detail_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL,
    created_by INT NOT NULL,
    FOREIGN KEY (partner_id) REFERENCES partners(partner_id) ON DELETE SET NULL,
    FOREIGN KEY (cover_image_id) REFERENCES images(image_id) ON DELETE SET NULL,
    FOREIGN KEY (detail_id) REFERENCES content_details(detail_id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES admins(admin_id) ON DELETE CASCADE
);

-- Streaming management
CREATE TABLE streams (
    stream_id INT AUTO_INCREMENT PRIMARY KEY,
    stream_title VARCHAR(255) NOT NULL,
    description TEXT,
    scheduled_start DATETIME NOT NULL,
    actual_start DATETIME NULL,
    end_time DATETIME NULL,
    status ENUM('scheduled', 'live', 'completed', 'cancelled') NOT NULL DEFAULT 'scheduled',
    video_id INT NULL,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL,
    FOREIGN KEY (video_id) REFERENCES videos(video_id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES admins(admin_id) ON DELETE CASCADE
);

-- Content-media relationships
CREATE TABLE news_images (
    news_id INT NOT NULL,
    image_id INT NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    PRIMARY KEY (news_id, image_id),
    FOREIGN KEY (news_id) REFERENCES news(news_id) ON DELETE CASCADE,
    FOREIGN KEY (image_id) REFERENCES images(image_id) ON DELETE CASCADE
);

CREATE TABLE news_videos (
    news_id INT NOT NULL,
    video_id INT NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    PRIMARY KEY (news_id, video_id),
    FOREIGN KEY (news_id) REFERENCES news(news_id) ON DELETE CASCADE,
    FOREIGN KEY (video_id) REFERENCES videos(video_id) ON DELETE CASCADE
);

CREATE TABLE information_images (
    information_id INT NOT NULL,
    image_id INT NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    PRIMARY KEY (information_id, image_id),
    FOREIGN KEY (information_id) REFERENCES information(information_id) ON DELETE CASCADE,
    FOREIGN KEY (image_id) REFERENCES images(image_id) ON DELETE CASCADE
);

CREATE TABLE information_videos (
    information_id INT NOT NULL,
    video_id INT NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    PRIMARY KEY (information_id, video_id),
    FOREIGN KEY (information_id) REFERENCES information(information_id) ON DELETE CASCADE,
    FOREIGN KEY (video_id) REFERENCES videos(video_id) ON DELETE CASCADE
);

-- Initial data insertion
INSERT INTO admin_roles (role_name, can_add_content, can_remove_content, can_start_stream, can_set_schedule, can_manage_users) VALUES 
('Super Admin', TRUE, TRUE, TRUE, TRUE, TRUE),
('Head Manager', TRUE, TRUE, TRUE, TRUE, FALSE),
('Content Manager', TRUE, TRUE, FALSE, TRUE, FALSE),
('Stream Manager', FALSE, FALSE, TRUE, TRUE, FALSE);

INSERT INTO video_types (type_name, description) VALUES 
('Stream', 'Live stream content'),
('Short Form', 'Short videos under 1 minute'),
('Long Form', 'Longer videos over 1 minute');

INSERT INTO information_types (type_name, description) VALUES 
('Speaker', 'Information about speakers'),
('Partner', 'Information about partners'),
('Event', 'Information about events'),
('Application Owner', 'Information about the application owners'),
('Contributor', 'Information about other contributors');

INSERT INTO partner_types (type_name, description) VALUES 
('Event Host', 'Organization hosting events'),
('Sponsor', 'Financial supporters of events'),
('Learning Institute', 'Educational institutions involved');