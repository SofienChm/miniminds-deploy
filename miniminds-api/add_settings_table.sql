-- Create AppSettings table
CREATE TABLE IF NOT EXISTS AppSettings (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    `Key` VARCHAR(100) NOT NULL UNIQUE,
    `Value` TEXT NOT NULL,
    UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insert default leave settings
INSERT INTO AppSettings (`Key`, `Value`, UpdatedAt) 
VALUES ('DefaultAnnualLeaveDays', '30', NOW())
ON DUPLICATE KEY UPDATE `Value` = '30';

INSERT INTO AppSettings (`Key`, `Value`, UpdatedAt) 
VALUES ('DefaultMedicalLeaveDays', '10', NOW())
ON DUPLICATE KEY UPDATE `Value` = '10';

SELECT * FROM AppSettings;
