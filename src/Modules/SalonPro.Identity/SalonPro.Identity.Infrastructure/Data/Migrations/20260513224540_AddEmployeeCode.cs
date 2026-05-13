using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SalonPro.Identity.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddEmployeeCode : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "EmployeeCode",
                table: "Users",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EmployeeCode",
                table: "Users");
        }
    }
}
