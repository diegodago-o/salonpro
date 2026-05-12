using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SalonPro.SalonOperations.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddBranchIdToServicesAndProducts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_SalonServices_TenantId",
                table: "SalonServices");

            migrationBuilder.DropIndex(
                name: "IX_SalonProducts_TenantId",
                table: "SalonProducts");

            migrationBuilder.AddColumn<int>(
                name: "BranchId",
                table: "SalonServices",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "BranchId",
                table: "SalonProducts",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_SalonServices_TenantId_BranchId",
                table: "SalonServices",
                columns: new[] { "TenantId", "BranchId" });

            migrationBuilder.CreateIndex(
                name: "IX_SalonProducts_TenantId_BranchId",
                table: "SalonProducts",
                columns: new[] { "TenantId", "BranchId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_SalonServices_TenantId_BranchId",
                table: "SalonServices");

            migrationBuilder.DropIndex(
                name: "IX_SalonProducts_TenantId_BranchId",
                table: "SalonProducts");

            migrationBuilder.DropColumn(
                name: "BranchId",
                table: "SalonServices");

            migrationBuilder.DropColumn(
                name: "BranchId",
                table: "SalonProducts");

            migrationBuilder.CreateIndex(
                name: "IX_SalonServices_TenantId",
                table: "SalonServices",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_SalonProducts_TenantId",
                table: "SalonProducts",
                column: "TenantId");
        }
    }
}
