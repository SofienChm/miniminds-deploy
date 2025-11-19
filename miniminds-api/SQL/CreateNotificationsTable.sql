CREATE TABLE IF NOT EXISTS Notifications (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    Type VARCHAR(50) NOT NULL DEFAULT 'General',
    Title VARCHAR(255) NOT NULL,
    Message TEXT NOT NULL,
    RedirectUrl VARCHAR(500) NULL,
    UserId VARCHAR(450) NULL,
    IsRead TINYINT(1) NOT NULL DEFAULT 0,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_userid (UserId),
    INDEX idx_isread (IsRead),
    INDEX idx_createdat (CreatedAt)
);
