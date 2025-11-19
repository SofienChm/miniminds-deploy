CREATE TABLE IF NOT EXISTS `ChildParents` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `ChildId` int NOT NULL,
    `ParentId` int NOT NULL,
    `RelationshipType` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'Parent',
    `IsPrimaryContact` tinyint(1) NOT NULL DEFAULT '0',
    CONSTRAINT `PK_ChildParents` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_ChildParents_Children_ChildId` FOREIGN KEY (`ChildId`) REFERENCES `Children` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `FK_ChildParents_Parents_ParentId` FOREIGN KEY (`ParentId`) REFERENCES `Parents` (`Id`) ON DELETE CASCADE,
    UNIQUE KEY `IX_ChildParents_ChildId_ParentId` (`ChildId`, `ParentId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
