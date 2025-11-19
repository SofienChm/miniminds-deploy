CREATE TABLE IF NOT EXISTS `ClassTeachers` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `ClassId` int NOT NULL,
    `TeacherId` int NOT NULL,
    `AssignedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT `PK_ClassTeachers` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_ClassTeachers_Classes_ClassId` FOREIGN KEY (`ClassId`) REFERENCES `Classes` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `FK_ClassTeachers_Teachers_TeacherId` FOREIGN KEY (`TeacherId`) REFERENCES `Teachers` (`Id`) ON DELETE CASCADE,
    UNIQUE KEY `IX_ClassTeachers_ClassId_TeacherId` (`ClassId`, `TeacherId`),
    KEY `IX_ClassTeachers_TeacherId` (`TeacherId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
