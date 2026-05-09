using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SalonPro.Tenants.Domain.Entities;
using SalonPro.Tenants.Domain.Enums;

namespace SalonPro.Tenants.Infrastructure.Data.Configurations;

public class TenantConfiguration : IEntityTypeConfiguration<Tenant>
{
    public void Configure(EntityTypeBuilder<Tenant> builder)
    {
        builder.ToTable("Tenants");
        builder.HasKey(t => t.Id);
        builder.Property(t => t.BusinessName).IsRequired().HasMaxLength(150);
        builder.Property(t => t.TradeName).HasMaxLength(100);
        builder.Property(t => t.Nit).IsRequired().HasMaxLength(20);
        builder.HasIndex(t => t.Nit).IsUnique();
        builder.Property(t => t.Slug).IsRequired().HasMaxLength(50);
        builder.HasIndex(t => t.Slug).IsUnique();
        builder.Property(t => t.Email).IsRequired().HasMaxLength(150);
        builder.HasIndex(t => t.Email).IsUnique();
        builder.Property(t => t.Phone).HasMaxLength(20);
        builder.Property(t => t.Address).HasMaxLength(200);
        builder.Property(t => t.City).HasMaxLength(100);
        builder.Property(t => t.LogoUrl).HasMaxLength(500);
        builder.Property(t => t.Status).HasConversion<string>().HasMaxLength(20);
        builder.Property(t => t.CreatedBy).HasMaxLength(100);
        builder.Property(t => t.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
        builder.Property(t => t.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");

        builder.HasOne(t => t.Subscription)
            .WithOne(s => s.Tenant)
            .HasForeignKey<Subscription>(s => s.TenantId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(t => t.Branches)
            .WithOne(b => b.Tenant)
            .HasForeignKey(b => b.TenantId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
