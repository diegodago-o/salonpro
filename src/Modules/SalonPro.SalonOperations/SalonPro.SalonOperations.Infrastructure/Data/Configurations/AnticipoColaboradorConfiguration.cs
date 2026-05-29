using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SalonPro.SalonOperations.Domain.Entities;

namespace SalonPro.SalonOperations.Infrastructure.Data.Configurations;

public class AnticipoColaboradorConfiguration : IEntityTypeConfiguration<AnticipoColaborador>
{
    public void Configure(EntityTypeBuilder<AnticipoColaborador> builder)
    {
        builder.ToTable("AnticiposColaborador");
        builder.HasKey(a => a.Id);

        builder.Property(a => a.StylistName)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(a => a.Amount)
            .HasColumnType("decimal(18,2)");

        builder.Property(a => a.Notes)
            .HasMaxLength(500);

        builder.Property(a => a.Status)
            .HasConversion<string>()
            .HasMaxLength(20);

        // Índice para las consultas más frecuentes
        builder.HasIndex(a => new { a.TenantId, a.StylistId, a.Status });
        builder.HasIndex(a => a.LiquidacionId);
    }
}
