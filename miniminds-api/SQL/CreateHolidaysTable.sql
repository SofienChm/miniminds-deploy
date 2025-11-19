CREATE TABLE IF NOT EXISTS `Holidays` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `Name` varchar(100) NOT NULL,
    `Description` varchar(500) NULL,
    `Date` datetime NOT NULL,
    `IsRecurring` tinyint(1) NOT NULL DEFAULT 0,
    `RecurrenceType` varchar(50) NULL,
    `Color` varchar(20) NOT NULL DEFAULT '#0d6efd',
    `CreatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `UpdatedAt` datetime NULL,
    PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
