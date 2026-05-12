using Microsoft.EntityFrameworkCore;
using SalonPro.SalonOperations.Domain.Entities;

namespace SalonPro.SalonOperations.Infrastructure.Data;

public class SalonOpsDbContext(DbContextOptions<SalonOpsDbContext> options) : DbContext(options)
{
    public DbSet<SalonService> SalonServices => Set<SalonService>();
    public DbSet<SalonProduct> SalonProducts => Set<SalonProduct>();
    public DbSet<Client> Clients => Set<Client>();
    public DbSet<PaymentMethod> PaymentMethods => Set<PaymentMethod>();
    public DbSet<Sale> Sales => Set<Sale>();
    public DbSet<SaleItem> SaleItems => Set<SaleItem>();
    public DbSet<SalePayment> SalePayments => Set<SalePayment>();
    public DbSet<CashRegister> CashRegisters => Set<CashRegister>();
    public DbSet<CashRegisterDetail> CashRegisterDetails => Set<CashRegisterDetail>();
    public DbSet<Anticipo> Anticipos => Set<Anticipo>();
    public DbSet<Liquidacion> Liquidaciones => Set<Liquidacion>();
    public DbSet<LiquidacionVenta> LiquidacionVentas => Set<LiquidacionVenta>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(SalonOpsDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}
