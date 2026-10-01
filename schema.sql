-- ========================================================
-- ALERT Hospital Management System - MySQL Database Schema
-- Database: alert_hospital
-- ========================================================

CREATE DATABASE IF NOT EXISTS `alert_hospital` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `alert_hospital`;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(128) NOT NULL,
  `username` VARCHAR(128) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` VARCHAR(64) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `department_slug` VARCHAR(128) DEFAULT NULL,
  `department_label` VARCHAR(255) DEFAULT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'active',
  `created_at` VARCHAR(64) NOT NULL,
  `updated_at` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_users_username` (`username`),
  KEY `idx_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Forms Table
CREATE TABLE IF NOT EXISTS `forms` (
  `id` VARCHAR(128) NOT NULL,
  `department_slug` VARCHAR(128) NOT NULL,
  `department_label` VARCHAR(255) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `banner_url` TEXT DEFAULT NULL,
  `questions_json` LONGTEXT NOT NULL,
  `created_at` VARCHAR(64) NOT NULL,
  `updated_at` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_forms_dept` (`department_slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Form Responses Table
CREATE TABLE IF NOT EXISTS `form_responses` (
  `id` VARCHAR(128) NOT NULL,
  `form_id` VARCHAR(128) NOT NULL,
  `submitted_at` VARCHAR(64) NOT NULL,
  `answers_json` LONGTEXT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_responses_form` (`form_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Patients Table
CREATE TABLE IF NOT EXISTS `patients` (
  `id` VARCHAR(128) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `mrn` VARCHAR(128) NOT NULL,
  `age` INT NOT NULL,
  `gender` VARCHAR(32) NOT NULL,
  `phone` VARCHAR(64) NOT NULL,
  `department_slug` VARCHAR(128) NOT NULL,
  `department_label` VARCHAR(255) NOT NULL,
  `registered_at` VARCHAR(64) NOT NULL,
  `status` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_patients_dept` (`department_slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Appointments Table
CREATE TABLE IF NOT EXISTS `appointments` (
  `id` VARCHAR(128) NOT NULL,
  `patient_name` VARCHAR(255) NOT NULL,
  `patient_id` VARCHAR(128) NOT NULL,
  `doctor_name` VARCHAR(255) NOT NULL,
  `department_slug` VARCHAR(128) NOT NULL,
  `department_label` VARCHAR(255) NOT NULL,
  `time` VARCHAR(64) NOT NULL,
  `date` VARCHAR(64) NOT NULL,
  `status` VARCHAR(64) NOT NULL,
  `created_at` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_appointments_dept` (`department_slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Activities Table
CREATE TABLE IF NOT EXISTS `activities` (
  `id` VARCHAR(128) NOT NULL,
  `type` VARCHAR(64) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `meta` TEXT NOT NULL,
  `timestamp` VARCHAR(64) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Reports Table
CREATE TABLE IF NOT EXISTS `reports` (
  `id` VARCHAR(128) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `category` VARCHAR(64) NOT NULL,
  `department` VARCHAR(255) NOT NULL,
  `department_slug` VARCHAR(128) NOT NULL,
  `author` VARCHAR(255) NOT NULL,
  `date` VARCHAR(64) NOT NULL,
  `score` VARCHAR(64) NOT NULL,
  `status` VARCHAR(64) NOT NULL,
  `summary` TEXT NOT NULL,
  `created_at` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_reports_dept` (`department_slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed Default Root Superadmin & Key Staff
INSERT INTO `users` (`id`, `username`, `password`, `role`, `name`, `department_slug`, `department_label`, `status`, `created_at`, `updated_at`)
VALUES
  ('usr-superadmin-habtamu', 'habtamu', 'Habtamu5645', 'superadmin', 'Habtamu (Super Administrator)', NULL, NULL, 'active', NOW(), NOW()),
  ('usr-admin-default', 'admin', 'Admin123', 'admin', 'Hospital Administrator', NULL, NULL, 'active', NOW(), NOW()),
  ('usr-coordinator-default', 'coordinator', 'Coord123', 'coordinator', 'Emergency Clinical Coordinator', 'emergency', 'Emergency & Critical Care', 'active', NOW(), NOW()),
  ('usr-qmt-default', 'qmt', 'Qmt123', 'qmt', 'Dr. Roman Sisay (QMT Officer)', NULL, NULL, 'active', NOW(), NOW())
ON DUPLICATE KEY UPDATE `password` = VALUES(`password`), `role` = VALUES(`role`), `status` = 'active', `updated_at` = NOW();
