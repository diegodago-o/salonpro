using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SalonPro.Tenants.Domain.Entities;

namespace SalonPro.Tenants.Infrastructure.Data.Configurations;

public class BranchConfiguration : IEntityTypeConfiguration<Branch>
{
    public void Configure(EntityTypeBuilder<Branch> builder)
    {
        builder.ToTable("Branches");
        builder.HasKey(b => b.Id);
        builder.Property(b => b.Name).IsRequired().HasMaxLength(150);
        builder.Property(b => b.Address).HasMaxLength(200);
        builder.Property(b => b.City).HasMaxLength(100);
        builder.Property(b => b.Phone).HasMaxLength(20);
        builder.Property(b => b.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
        builder.Property(b => b.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");

        builder.HasIndex(b => b.TenantId);
    }
}
