using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SalonPro.SalonOperations.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class BackfillSalesBranchId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Asignar BranchId a ventas históricas que ya tienen BranchName registrado
            // pero aún no tienen BranchId (fueron creadas antes de esta columna).
            // La tabla Branches vive en el mismo DbServer (módulo Tenants, misma DB).
            migrationBuilder.Sql(@"
                UPDATE s
                SET s.BranchId = b.Id
                FROM Sales s
                INNER JOIN Branches b
                    ON b.Name    = s.BranchName
                   AND b.TenantId = s.TenantId
                WHERE s.BranchId IS NULL
                  AND s.BranchName IS NOT NULL
                  AND s.BranchName <> ''
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // No hay rollback para datos — la columna BranchId sigue existiendo (nullable).
        }
    }
}
