using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SalonPro.SalonOperations.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class BackfillSaleItemStylistCommission : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Retroalimentar StylistCommissionPercent en SaleItems de tipo ProductSale
            // que quedaron en 0 antes de que se implementara el campo.
            // Usa el porcentaje actual del producto (mejor aproximación disponible).
            migrationBuilder.Sql(@"
                UPDATE si
                SET si.StylistCommissionPercent = sp.StylistCommissionPercent
                FROM SaleItems si
                INNER JOIN SalonProducts sp ON si.ReferenceId = sp.Id
                WHERE si.Type = 'ProductSale'
                  AND si.StylistCommissionPercent = 0
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // No se revierte el backfill (no hay manera de saber qué valor tenía antes)
        }
    }
}
