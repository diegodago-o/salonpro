using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SalonPro.SalonOperations.Infrastructure.Migrations
{
    [Microsoft.EntityFrameworkCore.Migrations.Migration("20260623230000_RecreateTicketsInDbo")]
    public partial class RecreateTicketsInDbo : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. Eliminar Tickets de cualquier schema que NO sea dbo
            migrationBuilder.Sql(@"
DECLARE @schema NVARCHAR(128);
DECLARE @sql    NVARCHAR(500);
SELECT @schema = s.name
FROM   sys.tables t
JOIN   sys.schemas s ON t.schema_id = s.schema_id
WHERE  t.name = 'Tickets' AND s.name <> 'dbo';
IF @schema IS NOT NULL
BEGIN
    SET @sql = 'DROP TABLE [' + @schema + '].[Tickets]';
    EXEC sp_executesql @sql;
END");

            // 2. Eliminar [dbo].[Tickets] si existe (recreación limpia)
            migrationBuilder.Sql(@"
IF OBJECT_ID(N'[dbo].[Tickets]', N'U') IS NOT NULL
    DROP TABLE [dbo].[Tickets];");

            // 3. Crear [dbo].[Tickets] con schema explícito
            migrationBuilder.Sql(@"
CREATE TABLE [dbo].[Tickets] (
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
);");

            // 4. Índices en [dbo].[Tickets]
            migrationBuilder.Sql(@"
CREATE INDEX [IX_Tickets_TenantId] ON [dbo].[Tickets] ([TenantId]);
CREATE INDEX [IX_Tickets_TenantId_SaleDateTime] ON [dbo].[Tickets] ([TenantId], [SaleDateTime]);");

            // 5. Agregar TicketId a [dbo].[Sales] si no existe
            migrationBuilder.Sql(@"
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'Sales' AND COLUMN_NAME = 'TicketId'
)
    ALTER TABLE [dbo].[Sales] ADD [TicketId] INT NULL;");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Tickets_TenantId_SaleDateTime' AND object_id = OBJECT_ID(N'[dbo].[Tickets]'))
    DROP INDEX [IX_Tickets_TenantId_SaleDateTime] ON [dbo].[Tickets];
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Tickets_TenantId' AND object_id = OBJECT_ID(N'[dbo].[Tickets]'))
    DROP INDEX [IX_Tickets_TenantId] ON [dbo].[Tickets];
IF OBJECT_ID(N'[dbo].[Tickets]', N'U') IS NOT NULL DROP TABLE [dbo].[Tickets];");
        }
    }
}
