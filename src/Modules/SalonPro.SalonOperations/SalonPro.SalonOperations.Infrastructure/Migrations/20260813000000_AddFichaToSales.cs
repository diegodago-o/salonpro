using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SalonPro.SalonOperations.Infrastructure.Migrations
{
    [Microsoft.EntityFrameworkCore.Migrations.Migration("20260813000000_AddFichaToSales")]
    public partial class AddFichaToSales : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'[dbo].[Sales]') AND name = N'Ficha'
)
BEGIN
    ALTER TABLE [dbo].[Sales] ADD [Ficha] NVARCHAR(100) NULL;
END");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'[dbo].[Sales]') AND name = N'Ficha'
)
BEGIN
    ALTER TABLE [dbo].[Sales] DROP COLUMN [Ficha];
END");
        }
    }
}
