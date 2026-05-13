using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SalonPro.SalonOperations.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddBranchIdToAnticiposAndLiquidaciones : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "BranchId",
                table: "Anticipos",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "BranchId",
                table: "Liquidaciones",
                type: "int",
                nullable: true);

            // Backfill: asignar BranchId a anticipos históricos usando la tabla Branches
            // (misma BD, módulo Tenants). Los registros sin BranchName quedan con NULL.
            migrationBuilder.Sql(@"
                UPDATE a
                SET a.BranchId = b.Id
                FROM Anticipos a
                INNER JOIN Branches b ON b.TenantId = a.TenantId
                WHERE a.BranchId IS NULL
                  AND (SELECT COUNT(*) FROM Branches WHERE TenantId = a.TenantId) = 1
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "BranchId", table: "Anticipos");
            migrationBuilder.DropColumn(name: "BranchId", table: "Liquidaciones");
        }
    }
}
