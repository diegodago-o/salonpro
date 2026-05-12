using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SalonPro.Identity.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddBranchNameTenantNameToUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BranchName",
                table: "Users",
                type: "nvarchar(150)",
                maxLength: 150,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TenantName",
                table: "Users",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BranchName",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "TenantName",
                table: "Users");
        }
    }
}
