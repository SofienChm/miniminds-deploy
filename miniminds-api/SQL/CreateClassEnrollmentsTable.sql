CREATE TABLE IF NOT EXISTS `ClassEnrollments` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `ClassId` int NOT NULL,
    `ChildId` int NOT NULL,
    `EnrolledAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT `PK_ClassEnrollments` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_ClassEnrollments_Classes_ClassId` FOREIGN KEY (`ClassId`) REFERENCES `Classes` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `FK_ClassEnrollments_Children_ChildId` FOREIGN KEY (`ChildId`) REFERENCES `Children` (`Id`) ON DELETE CASCADE,
    UNIQUE KEY `IX_ClassEnrollments_ClassId_ChildId` (`ClassId`, `ChildId`),
    KEY `IX_ClassEnrollments_ChildId` (`ChildId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
