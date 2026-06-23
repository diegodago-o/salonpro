using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SalonPro.SalonOperations.Infrastructure.Migrations
{
    [Microsoft.EntityFrameworkCore.Migrations.Migration("20260622000000_AddTickets")]
    public partial class AddTickets : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Usar SQL condicional para que la migración sea idempotente
            // (segura si ya fue aplicada parcialmente o completa)
            migrationBuilder.Sql(@"
IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Tickets' AND schema_id = SCHEMA_ID('dbo'))
BEGIN
    CREATE TABLE [dbo].[Tickets] (
        [Id]          INT            NOT NULL IDENTITY(1,1),
        [TenantId]    INT            NOT NULL,
        [BranchId]    INT            NULL,
        [BranchName]  NVARCHAR(200)  NULL,
        [ClientId]    INT            NULL,
        [ClientName]  NVARCHAR(200)  NOT NULL,
        [SaleDateTime] DATETIME2     NOT NULL,
        [GrossTotal]  DECIMAL(18,2)  NOT NULL,
        [TipAmount]   DECIMAL(18,2)  NOT NULL,
        [Status]      NVARCHAR(20)   NOT NULL,
        [Notes]       NVARCHAR(500)  NULL,
        [CreatedAt]   DATETIME2      NOT NULL,
        CONSTRAINT [PK_Tickets] PRIMARY KEY ([Id])
    );
END");

            migrationBuilder.Sql(@"
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID(N'[dbo].[Sales]') AND name = N'TicketId'
)
BEGIN
    ALTER TABLE [dbo].[Sales] ADD [TicketId] INT NULL;
END");

            migrationBuilder.Sql(@"
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Tickets_TenantId' AND object_id = OBJECT_ID('Tickets'))
    CREATE INDEX [IX_Tickets_TenantId] ON [Tickets] ([TenantId]);");

            migrationBuilder.Sql(@"
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Tickets_TenantId_SaleDateTime' AND object_id = OBJECT_ID('Tickets'))
    CREATE INDEX [IX_Tickets_TenantId_SaleDateTime] ON [Tickets] ([TenantId], [SaleDateTime]);");

            migrationBuilder.Sql(@"
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Sales_TicketId' AND object_id = OBJECT_ID('Sales'))
    CREATE INDEX [IX_Sales_TicketId] ON [Sales] ([TicketId]);");

            migrationBuilder.Sql(@"
IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_keys
    WHERE name = 'FK_Sales_Tickets_TicketId'
)
BEGIN
    ALTER TABLE [dbo].[Sales]
    ADD CONSTRAINT [FK_Sales_Tickets_TicketId]
    FOREIGN KEY ([TicketId]) REFERENCES [dbo].[Tickets] ([Id])
    ON DELETE SET NULL;
END");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Sales_Tickets_TicketId')
    ALTER TABLE [dbo].[Sales] DROP CONSTRAINT [FK_Sales_Tickets_TicketId];");

            migrationBuilder.Sql(@"
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Sales_TicketId' AND object_id = OBJECT_ID('Sales'))
    DROP INDEX [IX_Sales_TicketId] ON [Sales];");

            migrationBuilder.Sql(@"
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Sales]') AND name = N'TicketId')
    ALTER TABLE [dbo].[Sales] DROP COLUMN [TicketId];");

            migrationBuilder.Sql(@"
IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Tickets')
    DROP TABLE [dbo].[Tickets];");
        }
    }
}
