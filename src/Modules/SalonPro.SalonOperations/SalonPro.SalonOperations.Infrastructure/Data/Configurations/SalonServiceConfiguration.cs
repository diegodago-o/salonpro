using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SalonPro.SalonOperations.Domain.Entities;

namespace SalonPro.SalonOperations.Infrastructure.Data.Configurations;

public class SalonServiceConfiguration : IEntityTypeConfiguration<SalonService>
{
    public void Configure(EntityTypeBuilder<SalonService> builder)
    {
        builder.ToTable("SalonServices");
        builder.HasKey(s => s.Id);
        builder.Property(s => s.TenantId).IsRequired();
        builder.Property(s => s.Name).IsRequired().HasMaxLength(150);
        builder.Property(s => s.Category).IsRequired().HasMaxLength(100);
        builder.Property(s => s.Price).HasColumnType("decimal(18,2)");
        builder.Property(s => s.SalonFeePercent).HasColumnType("decimal(5,2)");
        builder.Property(s => s.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
        builder.HasIndex(s => s.TenantId);
    }
}
