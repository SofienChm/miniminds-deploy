using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DaycareAPI.Migrations
{
    /// <inheritdoc />
    public partial class UpdateMessagesForMailStyle : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "RecipientId",
                table: "Messages",
                type: "varchar(255)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "varchar(255)")
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<int>(
                name: "ParentMessageId",
                table: "Messages",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RecipientType",
                table: "Messages",
                type: "longtext",
                nullable: false)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "Subject",
                table: "Messages",
                type: "longtext",
                nullable: false)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_Messages_ParentMessageId",
                table: "Messages",
                column: "ParentMessageId");

            migrationBuilder.AddForeignKey(
                name: "FK_Messages_Messages_ParentMessageId",
                table: "Messages",
                column: "ParentMessageId",
                principalTable: "Messages",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Messages_Messages_ParentMessageId",
                table: "Messages");

            migrationBuilder.DropIndex(
                name: "IX_Messages_ParentMessageId",
                table: "Messages");

            migrationBuilder.DropColumn(
                name: "ParentMessageId",
                table: "Messages");

            migrationBuilder.DropColumn(
                name: "RecipientType",
                table: "Messages");

            migrationBuilder.DropColumn(
                name: "Subject",
                table: "Messages");

            migrationBuilder.UpdateData(
                table: "Messages",
                keyColumn: "RecipientId",
                keyValue: null,
                column: "RecipientId",
                value: "");

            migrationBuilder.AlterColumn<string>(
                name: "RecipientId",
                table: "Messages",
                type: "varchar(255)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(255)",
                oldNullable: true)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");
        }
    }
}
