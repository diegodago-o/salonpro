using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SalonPro.SalonOperations.Domain.Entities;

namespace SalonPro.SalonOperations.Infrastructure.Data.Configurations;

public class AnticipoConfiguration : IEntityTypeConfiguration<Anticipo>
{
    public void Configure(EntityTypeBuilder<Anticipo> builder)
    {
        builder.ToTable("Anticipos");
        builder.HasKey(a => a.Id);
        builder.Property(a => a.TenantId).IsRequired();
        builder.Property(a => a.BranchId);
        builder.Property(a => a.ClientName).IsRequired().HasMaxLength(200);
        builder.Property(a => a.ClientDocument).IsRequired().HasMaxLength(50);
        builder.Property(a => a.ClientPhone).IsRequired().HasMaxLength(20);
        builder.Property(a => a.Amount).HasColumnType("decimal(18,2)");
        builder.Property(a => a.PaymentMethodId).IsRequired();
        builder.Property(a => a.PaymentMethodName).IsRequired().HasMaxLength(100);
        builder.Property(a => a.Notes).HasMaxLength(500);
        builder.Property(a => a.Status).HasConversion<string>().HasMaxLength(20);
        builder.Property(a => a.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
        builder.HasIndex(a => a.TenantId);
    }
}
