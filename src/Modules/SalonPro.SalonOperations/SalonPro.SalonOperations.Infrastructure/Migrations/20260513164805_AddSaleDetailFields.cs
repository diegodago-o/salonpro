using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SalonPro.SalonOperations.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSaleDetailFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BranchName",
                table: "Sales",
                type: "nvarchar(150)",
                maxLength: 150,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ClientDocumentType",
                table: "Sales",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ClientEmail",
                table: "Sales",
                type: "nvarchar(150)",
                maxLength: 150,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ClientPhone",
                table: "Sales",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "CommissionPercent",
                table: "Sales",
                type: "decimal(5,2)",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BranchName",
                table: "Sales");

            migrationBuilder.DropColumn(
                name: "ClientDocumentType",
                table: "Sales");

            migrationBuilder.DropColumn(
                name: "ClientEmail",
                table: "Sales");

            migrationBuilder.DropColumn(
                name: "ClientPhone",
                table: "Sales");

            migrationBuilder.DropColumn(
                name: "CommissionPercent",
                table: "Sales");
        }
    }
}
