using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using SalonPro.Tenants.Domain.Entities;
using SalonPro.Tenants.Infrastructure.Data;

namespace SalonPro.Tenants.Infrastructure.Data.Seed;

public static class TenantsSeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        await using var scope = services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<TenantsDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<TenantsDbContext>>();

        await db.Database.MigrateAsync();

        if (!await db.Plans.AnyAsync())
        {
            var plans = new[]
            {
                Plan.Create("Básico",    maxBranches: 1, priceMonthly: 79_000m,  pricePerExtra: 39_000m, features: """["POS","Caja","Liquidaciones","1 sede"]"""),
                Plan.Create("Estándar",  maxBranches: 3, priceMonthly: 149_000m, pricePerExtra: 35_000m, features: """["POS","Caja","Liquidaciones","Anticipos","Inventario","3 sedes"]"""),
                Plan.Create("Premium",   maxBranches: 10, priceMonthly: 249_000m, pricePerExtra: 29_000m, features: """["POS","Caja","Liquidaciones","Anticipos","Inventario","Reportes","10 sedes","Soporte prioritario"]"""),
            };

            await db.Plans.AddRangeAsync(plans);
            await db.SaveChangesAsync();
            logger.LogInformation("✓ Planes iniciales creados: Básico, Estándar, Premium");
        }
        else
        {
            logger.LogInformation("Planes ya existentes — seed omitido.");
        }
    }
}
