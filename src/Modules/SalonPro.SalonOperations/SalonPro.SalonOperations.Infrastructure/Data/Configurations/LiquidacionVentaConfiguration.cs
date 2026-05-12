using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SalonPro.SalonOperations.Domain.Entities;

namespace SalonPro.SalonOperations.Infrastructure.Data.Configurations;

public class LiquidacionVentaConfiguration : IEntityTypeConfiguration<LiquidacionVenta>
{
    public void Configure(EntityTypeBuilder<LiquidacionVenta> builder)
    {
        builder.ToTable("LiquidacionVentas");
        builder.HasKey(v => v.Id);
        builder.Property(v => v.LiquidacionId).IsRequired();
        builder.Property(v => v.SaleId).IsRequired();
        builder.Property(v => v.ClientName).IsRequired().HasMaxLength(200);
        builder.Property(v => v.GrossServices).HasColumnType("decimal(18,2)");
        builder.Property(v => v.GrossProducts).HasColumnType("decimal(18,2)");
        builder.Property(v => v.Deduction).HasColumnType("decimal(18,2)");
        builder.Property(v => v.CommServices).HasColumnType("decimal(18,2)");
        builder.Property(v => v.CommProducts).HasColumnType("decimal(18,2)");
        builder.Property(v => v.Tip).HasColumnType("decimal(18,2)");
        builder.Property(v => v.InternalConsumption).HasColumnType("decimal(18,2)");
        builder.HasIndex(v => v.LiquidacionId);
    }
}
