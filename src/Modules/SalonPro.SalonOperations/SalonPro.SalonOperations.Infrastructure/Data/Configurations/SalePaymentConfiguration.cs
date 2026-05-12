using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SalonPro.SalonOperations.Domain.Entities;

namespace SalonPro.SalonOperations.Infrastructure.Data.Configurations;

public class SalePaymentConfiguration : IEntityTypeConfiguration<SalePayment>
{
    public void Configure(EntityTypeBuilder<SalePayment> builder)
    {
        builder.ToTable("SalePayments");
        builder.HasKey(p => p.Id);
        builder.Property(p => p.SaleId).IsRequired();
        builder.Property(p => p.PaymentMethodId).IsRequired();
        builder.Property(p => p.PaymentMethodName).IsRequired().HasMaxLength(100);
        builder.Property(p => p.Amount).HasColumnType("decimal(18,2)");
        builder.Property(p => p.DeductionPercent).HasColumnType("decimal(5,2)");
        builder.Property(p => p.DeductionAmount).HasColumnType("decimal(18,2)");
        builder.HasIndex(p => p.SaleId);
    }
}
