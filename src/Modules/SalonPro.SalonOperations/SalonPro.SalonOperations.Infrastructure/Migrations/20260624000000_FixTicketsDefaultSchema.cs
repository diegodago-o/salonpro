using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SalonPro.SalonOperations.Infrastructure.Migrations
{
    [Microsoft.EntityFrameworkCore.Migrations.Migration("20260624000000_FixTicketsDefaultSchema")]
    public partial class FixTicketsDefaultSchema : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // La migración anterior (RecreateTicketsInDbo) eliminó la tabla Tickets
            // del schema real del usuario de BD y creó una en [dbo] que EF Core nunca usa,
            // porque genera INSERT INTO [Tickets] (sin schema) que resuelve al schema
            // por defecto del usuario de conexión, que NO es [dbo].
            //
            // Esta migración crea Tickets en el schema correcto (el del usuario de BD)
            // usando SCHEMA_NAME() para no asumir nada.

            // 1. Crear Tickets en el schema del usuario de BD si no existe
            migrationBuilder.Sql(@"
IF NOT EXISTS (
    SELECT 1 FROM sys.tables
    WHERE  name = 'Tickets'
    AND    schema_id = SCHEMA_ID(SCHEMA_NAME())
)
BEGIN
    -- No especificamos schema → SQL Server lo crea en SCHEMA_NAME() (el schema del usuario)
    CREATE TABLE [Tickets] (
        [Id]           INT            NOT NULL IDENTITY(1,1),
        [TenantId]     INT            NOT NULL,
        [BranchId]     INT            NULL,
        [BranchName]   NVARCHAR(200)  NULL,
        [ClientId]     INT            NULL,
        [ClientName]   NVARCHAR(200)  NOT NULL,
        [SaleDateTime] DATETIME2      NOT NULL,
        [GrossTotal]   DECIMAL(18,2)  NOT NULL,
        [TipAmount]    DECIMAL(18,2)  NOT NULL,
        [Status]       NVARCHAR(20)   NOT NULL,
        [Notes]        NVARCHAR(500)  NULL,
        [CreatedAt]    DATETIME2      NOT NULL,
        CONSTRAINT [PK_Tickets] PRIMARY KEY ([Id])
    );
    CREATE INDEX [IX_Tickets_TenantId]             ON [Tickets] ([TenantId]);
    CREATE INDEX [IX_Tickets_TenantId_SaleDateTime] ON [Tickets] ([TenantId], [SaleDateTime]);
END");

            // 2. Agregar TicketId a Sales en el schema real (sin asumir dbo)
            migrationBuilder.Sql(@"
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE  object_id = OBJECT_ID('Sales')   -- resuelve en schema del usuario
    AND    name = 'TicketId'
)
    ALTER TABLE [Sales] ADD [TicketId] INT NULL;");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Sales') AND name = 'TicketId')
    ALTER TABLE [Sales] DROP COLUMN [TicketId];
IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Tickets' AND schema_id = SCHEMA_ID(SCHEMA_NAME()))
    DROP TABLE [Tickets];");
        }
    }
}
