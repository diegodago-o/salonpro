using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SalonPro.SalonOperations.Domain.Entities;

namespace SalonPro.SalonOperations.Infrastructure.Data.Configurations;

public class SaleItemConfiguration : IEntityTypeConfiguration<SaleItem>
{
    public void Configure(EntityTypeBuilder<SaleItem> builder)
    {
        builder.ToTable("SaleItems");
        builder.HasKey(i => i.Id);
        builder.Property(i => i.SaleId).IsRequired();
        builder.Property(i => i.Type).HasConversion<string>().HasMaxLength(30);
        builder.Property(i => i.ReferenceId).IsRequired();
        builder.Property(i => i.Name).IsRequired().HasMaxLength(200);
        builder.Property(i => i.UnitPrice).HasColumnType("decimal(18,2)");
        builder.Property(i => i.SalonFeePercent).HasColumnType("decimal(5,2)");
        builder.HasIndex(i => i.SaleId);
    }
}
