using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SalonPro.SalonOperations.Domain.Entities;
using SalonPro.SalonOperations.Domain.Enums;

namespace SalonPro.SalonOperations.Infrastructure.Data.Configurations;

public class SaleConfiguration : IEntityTypeConfiguration<Sale>
{
    public void Configure(EntityTypeBuilder<Sale> builder)
    {
        builder.ToTable("Sales");
        builder.HasKey(s => s.Id);
        builder.Property(s => s.TenantId).IsRequired();
        builder.Property(s => s.StylistId).IsRequired();
        builder.Property(s => s.StylistName).IsRequired().HasMaxLength(200);
        builder.Property(s => s.ClientName).IsRequired().HasMaxLength(200);
        builder.Property(s => s.ClientDocument).IsRequired().HasMaxLength(50);
        builder.Property(s => s.GrossServices).HasColumnType("decimal(18,2)");
        builder.Property(s => s.GrossProducts).HasColumnType("decimal(18,2)");
        builder.Property(s => s.InternalConsumption).HasColumnType("decimal(18,2)");
        builder.Property(s => s.TipAmount).HasColumnType("decimal(18,2)");
        builder.Property(s => s.TotalDeductions).HasColumnType("decimal(18,2)");
        builder.Property(s => s.StylistTotal).HasColumnType("decimal(18,2)");
        builder.Property(s => s.SalonTotal).HasColumnType("decimal(18,2)");
        builder.Property(s => s.GrossTotal).HasColumnType("decimal(18,2)");
        builder.Property(s => s.Status).HasConversion<string>().HasMaxLength(20);
        builder.Property(s => s.VoidedReason).HasMaxLength(500);
        builder.Property(s => s.Notes).HasMaxLength(500);
        builder.Property(s => s.SaleDateTime).HasDefaultValueSql("GETUTCDATE()");

        builder.HasMany(s => s.Items)
            .WithOne(i => i.Sale)
            .HasForeignKey(i => i.SaleId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(s => s.Payments)
            .WithOne(p => p.Sale)
            .HasForeignKey(p => p.SaleId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(s => s.TenantId);
        builder.HasIndex(s => s.SaleDateTime);
    }
}
