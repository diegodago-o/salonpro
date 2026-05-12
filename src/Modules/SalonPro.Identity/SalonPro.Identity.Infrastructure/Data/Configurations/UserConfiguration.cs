using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SalonPro.Identity.Domain.Entities;

namespace SalonPro.Identity.Infrastructure.Data.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("Users");
        builder.HasKey(u => u.Id);
        builder.Property(u => u.FullName).IsRequired().HasMaxLength(200);
        builder.Property(u => u.Email).IsRequired().HasMaxLength(150);
        builder.HasIndex(u => u.Email).IsUnique();
        builder.Property(u => u.PasswordHash).IsRequired().HasMaxLength(500);
        builder.Property(u => u.DocumentType).HasMaxLength(20);
        builder.Property(u => u.DocumentNumber).HasMaxLength(20);
        builder.Property(u => u.Phone).HasMaxLength(20);
        builder.Property(u => u.Role).HasConversion<string>().HasMaxLength(20);
        builder.Property(u => u.CommissionPercent).HasColumnType("decimal(5,2)");
        builder.Property(u => u.RefreshToken).HasMaxLength(500);
        builder.Property(u => u.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
        builder.Property(u => u.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");

        builder.HasIndex(u => new { u.TenantId, u.Role });
        builder.HasIndex(u => u.BranchId);
    }
}
