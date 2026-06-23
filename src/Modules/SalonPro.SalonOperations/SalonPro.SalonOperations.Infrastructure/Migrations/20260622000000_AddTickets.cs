using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SalonPro.SalonOperations.Infrastructure.Migrations
{
    public partial class AddTickets : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Tickets",
                columns: table => new
                {
                    Id          = table.Column<int>(nullable: false).Annotation("SqlServer:Identity", "1, 1"),
                    TenantId    = table.Column<int>(nullable: false),
                    BranchId    = table.Column<int>(nullable: true),
                    BranchName  = table.Column<string>(maxLength: 200, nullable: true),
                    ClientId    = table.Column<int>(nullable: true),
                    ClientName  = table.Column<string>(maxLength: 200, nullable: false),
                    SaleDateTime = table.Column<System.DateTime>(nullable: false),
                    GrossTotal  = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TipAmount   = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Status      = table.Column<string>(maxLength: 20, nullable: false),
                    Notes       = table.Column<string>(maxLength: 500, nullable: true),
                    CreatedAt   = table.Column<System.DateTime>(nullable: false),
                },
                constraints: table => table.PrimaryKey("PK_Tickets", x => x.Id));

            migrationBuilder.AddColumn<int>(
                name: "TicketId",
                table: "Sales",
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

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey("FK_Sales_Tickets_TicketId", "Sales");
            migrationBuilder.DropIndex("IX_Sales_TicketId", "Sales");
            migrationBuilder.DropColumn("TicketId", "Sales");
            migrationBuilder.DropTable("Tickets");
        }
    }
}
