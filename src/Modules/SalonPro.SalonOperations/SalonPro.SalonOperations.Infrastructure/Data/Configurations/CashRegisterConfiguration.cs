using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SalonPro.SalonOperations.Domain.Entities;

namespace SalonPro.SalonOperations.Infrastructure.Data.Configurations;

public class CashRegisterConfiguration : IEntityTypeConfiguration<CashRegister>
{
    public void Configure(EntityTypeBuilder<CashRegister> builder)
    {
        builder.ToTable("CashRegisters");
        builder.HasKey(c => c.Id);
        builder.Property(c => c.TenantId).IsRequired();
        builder.Property(c => c.BranchId).IsRequired();
        builder.Property(c => c.BranchName).IsRequired().HasMaxLength(150);
        builder.Property(c => c.CashierId).IsRequired();
        builder.Property(c => c.CashierName).IsRequired().HasMaxLength(200);
        builder.Property(c => c.OpeningBalance).HasColumnType("decimal(18,2)");
        builder.Property(c => c.DeclaredCash).HasColumnType("decimal(18,2)");
        builder.Property(c => c.ExpectedCash).HasColumnType("decimal(18,2)");
        builder.Property(c => c.Difference).HasColumnType("decimal(18,2)");
        builder.Property(c => c.Status).HasConversion<string>().HasMaxLength(20);
        builder.Property(c => c.Notes).HasMaxLength(500);
        builder.Property(c => c.OpenedAt).HasDefaultValueSql("GETUTCDATE()");

        builder.HasMany(c => c.Details)
            .WithOne(d => d.CashRegister)
            .HasForeignKey(d => d.CashRegisterId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(c => c.TenantId);
    }
}
