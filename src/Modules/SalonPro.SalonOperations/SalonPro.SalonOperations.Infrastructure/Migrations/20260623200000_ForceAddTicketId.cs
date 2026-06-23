using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SalonPro.SalonOperations.Infrastructure.Migrations
{
    [Microsoft.EntityFrameworkCore.Migrations.Migration("20260623200000_ForceAddTicketId")]
    public partial class ForceAddTicketId : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Crear tabla Tickets si no existe — sin asumir schema dbo
            migrationBuilder.Sql(@"
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Tickets')
BEGIN
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
END");

            // Agregar TicketId a Sales usando TRY/CATCH — no asume schema
            // Si la columna ya existe, ignora el error silenciosamente
            migrationBuilder.Sql(@"
BEGIN TRY
    ALTER TABLE [Sales] ADD [TicketId] INT NULL;
END TRY
BEGIN CATCH
    IF ERROR_NUMBER() NOT IN (2705, 21577)
        THROW;
END CATCH");

            // Índice en Tickets
            migrationBuilder.Sql(@"
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Tickets_TenantId')
    CREATE INDEX [IX_Tickets_TenantId] ON [Tickets] ([TenantId]);");

            // Índice en Sales.TicketId
            migrationBuilder.Sql(@"
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Sales_TicketId')
    CREATE INDEX [IX_Sales_TicketId] ON [Sales] ([TicketId]);");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
BEGIN TRY
    DROP INDEX [IX_Sales_TicketId] ON [Sales];
END TRY BEGIN CATCH END CATCH");

            migrationBuilder.Sql(@"
BEGIN TRY
    ALTER TABLE [Sales] DROP COLUMN [TicketId];
END TRY BEGIN CATCH END CATCH");

            migrationBuilder.Sql(@"
IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Tickets')
    DROP TABLE [Tickets];");
        }
    }
}
