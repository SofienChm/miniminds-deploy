-- Add optional fields to Parents table
-- Gender, DateOfBirth, Work, ZipCode

USE DaycareDB;

-- Check if columns exist before adding them
SET @dbname = 'DaycareDB';
SET @tablename = 'Parents';

-- Add Gender column if it doesn't exist
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = @dbname 
AND TABLE_NAME = @tablename 
AND COLUMN_NAME = 'Gender';

SET @query = IF(@col_exists = 0,
    'ALTER TABLE Parents ADD COLUMN Gender VARCHAR(10) NULL',
    'SELECT "Column Gender already exists" AS message');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add DateOfBirth column if it doesn't exist
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = @dbname 
AND TABLE_NAME = @tablename 
AND COLUMN_NAME = 'DateOfBirth';

SET @query = IF(@col_exists = 0,
    'ALTER TABLE Parents ADD COLUMN DateOfBirth DATETIME NULL',
    'SELECT "Column DateOfBirth already exists" AS message');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add Work column if it doesn't exist
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = @dbname 
AND TABLE_NAME = @tablename 
AND COLUMN_NAME = 'Work';

SET @query = IF(@col_exists = 0,
    'ALTER TABLE Parents ADD COLUMN Work VARCHAR(200) NULL',
    'SELECT "Column Work already exists" AS message');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add ZipCode column if it doesn't exist
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = @dbname 
AND TABLE_NAME = @tablename 
AND COLUMN_NAME = 'ZipCode';

SET @query = IF(@col_exists = 0,
    'ALTER TABLE Parents ADD COLUMN ZipCode VARCHAR(20) NULL',
    'SELECT "Column ZipCode already exists" AS message');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT 'Parent optional fields migration completed successfully' AS Status;
