using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SalonPro.SalonOperations.Domain.Entities;

namespace SalonPro.SalonOperations.Infrastructure.Data.Configurations;

public class TicketConfiguration : IEntityTypeConfiguration<Ticket>
{
    public void Configure(EntityTypeBuilder<Ticket> b)
    {
        b.ToTable("Tickets");
        b.HasKey(t => t.Id);
        b.Property(t => t.TenantId).IsRequired();
        b.Property(t => t.ClientName).HasMaxLength(200).IsRequired();
        b.Property(t => t.BranchName).HasMaxLength(200);
        b.Property(t => t.Status).HasMaxLength(20).IsRequired();
        b.Property(t => t.GrossTotal).HasColumnType("decimal(18,2)").IsRequired();
        b.Property(t => t.TipAmount).HasColumnType("decimal(18,2)").IsRequired();
        b.Property(t => t.Notes).HasMaxLength(500);

        b.HasIndex(t => t.TenantId);
        b.HasIndex(t => new { t.TenantId, t.SaleDateTime });

        b.HasMany(t => t.Sales)
         .WithOne()
         .HasForeignKey(s => s.TicketId)
         .OnDelete(DeleteBehavior.SetNull);
    }
}
