using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SalonPro.SalonOperations.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixDebitoCardDeduction : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Corregir la deducción de "Tarjeta débito" para todos los tenants.
            // Anteriormente se creó con HasDeduction=false, DeductionPercent=0.
            // Debe tener el mismo descuento bancario que Tarjeta crédito (7%).
            migrationBuilder.Sql(@"
                UPDATE PaymentMethods
                SET    HasDeduction     = 1,
                       DeductionPercent = 7
                WHERE  Name = N'Tarjeta débito'
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                UPDATE PaymentMethods
                SET    HasDeduction     = 0,
                       DeductionPercent = 0
                WHERE  Name = N'Tarjeta débito'
            ");
        }
    }
}
