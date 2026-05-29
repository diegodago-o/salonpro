using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SalonPro.SalonOperations.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAnticiposColaborador : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<decimal>(
                name: "StylistCommissionPercent",
                table: "SalonProducts",
                type: "decimal(18,2)",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(5,2)",
                oldDefaultValue: 10m);

            migrationBuilder.AlterColumn<decimal>(
                name: "StylistCommissionPercent",
                table: "SaleItems",
                type: "decimal(18,2)",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(5,2)");

            migrationBuilder.CreateTable(
                name: "AnticiposColaborador",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenantId = table.Column<int>(type: "int", nullable: false),
                    BranchId = table.Column<int>(type: "int", nullable: true),
                    StylistId = table.Column<int>(type: "int", nullable: false),
                    StylistName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    LiquidacionId = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AnticiposColaborador", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AnticiposColaborador_LiquidacionId",
                table: "AnticiposColaborador",
                column: "LiquidacionId");

            migrationBuilder.CreateIndex(
                name: "IX_AnticiposColaborador_TenantId_StylistId_Status",
                table: "AnticiposColaborador",
                columns: new[] { "TenantId", "StylistId", "Status" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AnticiposColaborador");

            migrationBuilder.AlterColumn<decimal>(
                name: "StylistCommissionPercent",
                table: "SalonProducts",
                type: "decimal(5,2)",
                nullable: false,
                defaultValue: 10m,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)");

            migrationBuilder.AlterColumn<decimal>(
                name: "StylistCommissionPercent",
                table: "SaleItems",
                type: "decimal(5,2)",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)");
        }
    }
}
