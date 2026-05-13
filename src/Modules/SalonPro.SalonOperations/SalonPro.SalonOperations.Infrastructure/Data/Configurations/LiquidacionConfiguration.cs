using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SalonPro.SalonOperations.Domain.Entities;

namespace SalonPro.SalonOperations.Infrastructure.Data.Configurations;

public class LiquidacionConfiguration : IEntityTypeConfiguration<Liquidacion>
{
    public void Configure(EntityTypeBuilder<Liquidacion> builder)
    {
        builder.ToTable("Liquidaciones");
        builder.HasKey(l => l.Id);
        builder.Property(l => l.TenantId).IsRequired();
        builder.Property(l => l.BranchId);
        builder.Property(l => l.StylistId).IsRequired();
        builder.Property(l => l.StylistName).IsRequired().HasMaxLength(200);
        builder.Property(l => l.GrossServices).HasColumnType("decimal(18,2)");
        builder.Property(l => l.GrossProducts).HasColumnType("decimal(18,2)");
        builder.Property(l => l.TotalDeductions).HasColumnType("decimal(18,2)");
        builder.Property(l => l.CommServices).HasColumnType("decimal(18,2)");
        builder.Property(l => l.CommProducts).HasColumnType("decimal(18,2)");
        builder.Property(l => l.TotalTips).HasColumnType("decimal(18,2)");
        builder.Property(l => l.InternalConsumption).HasColumnType("decimal(18,2)");
        builder.Property(l => l.AnticiposAplicados).HasColumnType("decimal(18,2)");
        builder.Property(l => l.NetoPeluquero).HasColumnType("decimal(18,2)");
        builder.Property(l => l.Status).HasConversion<string>().HasMaxLength(20);

        builder.HasMany(l => l.Ventas)
            .WithOne(v => v.Liquidacion)
            .HasForeignKey(v => v.LiquidacionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(l => l.TenantId);
    }
}
