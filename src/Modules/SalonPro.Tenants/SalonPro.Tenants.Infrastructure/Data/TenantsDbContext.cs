using Microsoft.EntityFrameworkCore;
using SalonPro.Tenants.Domain.Entities;

namespace SalonPro.Tenants.Infrastructure.Data;

public class TenantsDbContext(DbContextOptions<TenantsDbContext> options) : DbContext(options)
{
    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<Plan> Plans => Set<Plan>();
    public DbSet<Subscription> Subscriptions => Set<Subscription>();
    public DbSet<Branch> Branches => Set<Branch>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(TenantsDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}
