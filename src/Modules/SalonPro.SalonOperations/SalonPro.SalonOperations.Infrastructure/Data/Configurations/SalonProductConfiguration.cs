using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SalonPro.SalonOperations.Domain.Entities;

namespace SalonPro.SalonOperations.Infrastructure.Data.Configurations;

public class SalonProductConfiguration : IEntityTypeConfiguration<SalonProduct>
{
    public void Configure(EntityTypeBuilder<SalonProduct> builder)
    {
        builder.ToTable("SalonProducts");
        builder.HasKey(p => p.Id);
        builder.Property(p => p.TenantId).IsRequired();
        builder.Property(p => p.BranchId).IsRequired();
        builder.Property(p => p.Name).IsRequired().HasMaxLength(150);
        builder.Property(p => p.Brand).IsRequired().HasMaxLength(100);
        builder.Property(p => p.Category).IsRequired().HasMaxLength(100);
        builder.Property(p => p.PurchasePrice).HasColumnType("decimal(18,2)");
        builder.Property(p => p.SalePrice).HasColumnType("decimal(18,2)");
        builder.Property(p => p.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
        builder.HasIndex(p => new { p.TenantId, p.BranchId });
    }
}
