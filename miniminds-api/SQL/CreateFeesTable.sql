CREATE TABLE IF NOT EXISTS Fees (
    Id INT AUTO_INCREMENT PRIMARY KEY,
    ChildId INT NOT NULL,
    Amount DECIMAL(10, 2) NOT NULL,
    Description VARCHAR(500) NOT NULL,
    DueDate DATETIME NOT NULL,
    PaidDate DATETIME NULL,
    Status VARCHAR(20) NOT NULL DEFAULT 'pending',
    FeeType VARCHAR(20) NOT NULL DEFAULT 'monthly',
    Notes VARCHAR(1000) NULL,
    PaymentNotes VARCHAR(1000) NULL,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME NULL,
    FOREIGN KEY (ChildId) REFERENCES Children(Id) ON DELETE CASCADE,
    INDEX idx_child (ChildId),
    INDEX idx_status (Status),
    INDEX idx_duedate (DueDate)
);
