using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SalonPro.SalonOperations.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddProductStylistCommission : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "StylistCommissionPercent",
                table: "SalonProducts",
                type: "decimal(5,2)",
                nullable: false,
                defaultValue: 10m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "StylistCommissionPercent",
                table: "SalonProducts");
        }
    }
}
