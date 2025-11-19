using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DaycareAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddTeacherAndRoles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ProgramEnrollments_Programs_ProgramId",
                table: "ProgramEnrollments");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Programs",
                table: "Programs");

            migrationBuilder.RenameTable(
                name: "Programs",
                newName: "DaycarePrograms");

            migrationBuilder.AddColumn<string>(
                name: "UserId",
                table: "Parents",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "UserId1",
                table: "Parents",
                type: "varchar(255)",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<int>(
                name: "ParentId",
                table: "AspNetUsers",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TeacherId",
                table: "AspNetUsers",
                type: "int",
                nullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_DaycarePrograms",
                table: "DaycarePrograms",
                column: "Id");

            migrationBuilder.CreateTable(
                name: "Teachers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    FirstName = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    LastName = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Email = table.Column<string>(type: "varchar(255)", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Phone = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Address = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DateOfBirth = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    HireDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    Specialization = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Salary = table.Column<decimal>(type: "decimal(65,30)", nullable: false),
                    ProfilePicture = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IsActive = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    UserId = table.Column<string>(type: "varchar(255)", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Teachers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Teachers_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_Parents_UserId1",
                table: "Parents",
                column: "UserId1");

            migrationBuilder.CreateIndex(
                name: "IX_Teachers_Email",
                table: "Teachers",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Teachers_UserId",
                table: "Teachers",
                column: "UserId",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Parents_AspNetUsers_UserId1",
                table: "Parents",
                column: "UserId1",
                principalTable: "AspNetUsers",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_ProgramEnrollments_DaycarePrograms_ProgramId",
                table: "ProgramEnrollments",
                column: "ProgramId",
                principalTable: "DaycarePrograms",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Parents_AspNetUsers_UserId1",
                table: "Parents");

            migrationBuilder.DropForeignKey(
                name: "FK_ProgramEnrollments_DaycarePrograms_ProgramId",
                table: "ProgramEnrollments");

            migrationBuilder.DropTable(
                name: "Teachers");

            migrationBuilder.DropIndex(
                name: "IX_Parents_UserId1",
                table: "Parents");

            migrationBuilder.DropPrimaryKey(
                name: "PK_DaycarePrograms",
                table: "DaycarePrograms");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "Parents");

            migrationBuilder.DropColumn(
                name: "UserId1",
                table: "Parents");

            migrationBuilder.DropColumn(
                name: "ParentId",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "TeacherId",
                table: "AspNetUsers");

            migrationBuilder.RenameTable(
                name: "DaycarePrograms",
                newName: "Programs");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Programs",
                table: "Programs",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_ProgramEnrollments_Programs_ProgramId",
                table: "ProgramEnrollments",
                column: "ProgramId",
                principalTable: "Programs",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
