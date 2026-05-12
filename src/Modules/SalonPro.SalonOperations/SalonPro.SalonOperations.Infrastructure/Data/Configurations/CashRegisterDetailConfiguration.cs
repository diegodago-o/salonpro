using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SalonPro.SalonOperations.Domain.Entities;

namespace SalonPro.SalonOperations.Infrastructure.Data.Configurations;

public class CashRegisterDetailConfiguration : IEntityTypeConfiguration<CashRegisterDetail>
{
    public void Configure(EntityTypeBuilder<CashRegisterDetail> builder)
    {
        builder.ToTable("CashRegisterDetails");
        builder.HasKey(d => d.Id);
        builder.Property(d => d.CashRegisterId).IsRequired();
        builder.Property(d => d.PaymentMethodId).IsRequired();
        builder.Property(d => d.PaymentMethodName).IsRequired().HasMaxLength(100);
        builder.Property(d => d.TotalAmount).HasColumnType("decimal(18,2)");
        builder.Property(d => d.TotalDeductions).HasColumnType("decimal(18,2)");
        builder.Property(d => d.NetAmount).HasColumnType("decimal(18,2)");
        builder.HasIndex(d => d.CashRegisterId);
    }
}
