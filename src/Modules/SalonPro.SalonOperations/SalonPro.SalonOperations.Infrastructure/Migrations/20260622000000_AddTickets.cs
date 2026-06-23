using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SalonPro.SalonOperations.Infrastructure.Migrations
{
    /// <inheritdoc />
    [Microsoft.EntityFrameworkCore.Migrations.Migration("20260622000000_AddTickets")]
    public partial class AddTickets : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Tickets",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenantId     = table.Column<int>(type: "int", nullable: false),
                    BranchId     = table.Column<int>(type: "int", nullable: true),
                    BranchName   = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    ClientId     = table.Column<int>(type: "int", nullable: true),
                    ClientName   = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    SaleDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    GrossTotal   = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TipAmount    = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Status       = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Notes        = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedAt    = table.Column<DateTime>(type: "datetime2", nullable: false),
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tickets", x => x.Id);
                });

            migrationBuilder.AddColumn<int>(
                name: "TicketId",
                table: "Sales",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_TenantId",
                table: "Tickets",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_TenantId_SaleDateTime",
                table: "Tickets",
                columns: new[] { "TenantId", "SaleDateTime" });

            migrationBuilder.CreateIndex(
                name: "IX_Sales_TicketId",
                table: "Sales",
                column: "TicketId");

            migrationBuilder.AddForeignKey(
                name: "FK_Sales_Tickets_TicketId",
                table: "Sales",
                column: "TicketId",
                principalTable: "Tickets",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey("FK_Sales_Tickets_TicketId", "Sales");
            migrationBuilder.DropIndex("IX_Sales_TicketId", "Sales");
            migrationBuilder.DropColumn("TicketId", "Sales");
            migrationBuilder.DropTable("Tickets");
        }
    }
}
