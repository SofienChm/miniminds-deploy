CREATE TABLE IF NOT EXISTS `Classes` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `Name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
    `Description` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
    `TeacherId` int NULL,
    `Capacity` int NOT NULL,
    `AgeGroupMin` int NOT NULL,
    `AgeGroupMax` int NOT NULL,
    `Schedule` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
    `IsActive` tinyint(1) NOT NULL DEFAULT '1',
    `CreatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `UpdatedAt` datetime(6) NULL,
    CONSTRAINT `PK_Classes` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_Classes_Teachers_TeacherId` FOREIGN KEY (`TeacherId`) REFERENCES `Teachers` (`Id`) ON DELETE SET NULL,
    KEY `IX_Classes_TeacherId` (`TeacherId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
