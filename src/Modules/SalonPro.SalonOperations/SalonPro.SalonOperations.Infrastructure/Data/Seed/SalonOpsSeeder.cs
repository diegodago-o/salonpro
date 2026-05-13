using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using SalonPro.Identity.Domain.Entities;
using SalonPro.Identity.Domain.Enums;
using SalonPro.Identity.Domain.Interfaces;
using SalonPro.Identity.Infrastructure.Data;
using SalonPro.SalonOperations.Domain.Entities;
using SalonPro.SalonOperations.Infrastructure.Data;
using SalonPro.Tenants.Domain.Entities;
using SalonPro.Tenants.Domain.Enums;
using SalonPro.Tenants.Infrastructure.Data;

namespace SalonPro.SalonOperations.Infrastructure.Data.Seed;

public static class SalonOpsSeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        await using var scope = services.CreateAsyncScope();
        var tenantsDb  = scope.ServiceProvider.GetRequiredService<TenantsDbContext>();
        var identityDb = scope.ServiceProvider.GetRequiredService<IdentityDbContext>();
        var salonDb    = scope.ServiceProvider.GetRequiredService<SalonOpsDbContext>();
        var hasher     = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
        var logger     = scope.ServiceProvider.GetRequiredService<ILogger<SalonOpsDbContext>>();

        // ── 1. Tenant + Branch demo ──────────────────────────────────────────
        var tenant = await tenantsDb.Tenants
            .Include(t => t.Branches)
            .FirstOrDefaultAsync(t => t.Slug == "demo");

        if (tenant is null)
        {
            var plan = await tenantsDb.Plans.FirstOrDefaultAsync()
                ?? throw new InvalidOperationException("Ejecuta TenantsSeeder primero (sin planes no hay demo).");

            tenant = Tenant.Create(
                businessName: "Salón Demo",
                tradeName: "Demo Salón",
                nit: "900000001-0",
                slug: "demo",
                email: "demo@salonpro.com.co",
                phone: "3001234567",
                address: "Calle 10 # 20-30",
                city: "Medellín",
                createdBy: "seeder");

            await tenantsDb.Tenants.AddAsync(tenant);
            await tenantsDb.SaveChangesAsync();

            // Activar tenant
            tenant.ChangeStatus(TenantStatus.Active);

            var sub = Subscription.Create(tenant.Id, plan.Id, plan.PriceMonthly,
                plan.PricePerExtra, extraBranches: 0, BillingCycle.Monthly);
            sub.Activate();
            await tenantsDb.Subscriptions.AddAsync(sub);

            var branch = Branch.Create(tenant.Id, "Sede Principal", "Calle 10 # 20-30", "Medellín", "3001234567");
            await tenantsDb.Branches.AddAsync(branch);
            await tenantsDb.SaveChangesAsync();

            logger.LogInformation("✓ Tenant demo creado: slug=demo, id={Id}", tenant.Id);
        }

        var mainBranch = tenant.Branches.FirstOrDefault()
            ?? await tenantsDb.Branches.FirstAsync(b => b.TenantId == tenant.Id);

        int tenantId = tenant.Id;
        int branchId = mainBranch.Id;

        // ── 2. Usuarios demo ─────────────────────────────────────────────────
        const string branchName = "Sede Principal";
        const string tenantName = "Salón Demo";

        if (!await identityDb.Users.AnyAsync(u => u.TenantId == tenantId))
        {
            var users = new[]
            {
                User.Create("Dueño Demo",      "dueno@demo.com",   hasher.Hash("Owner2026!"),   UserRole.TenantOwner, tenantId, branchId, branchName: branchName, tenantName: tenantName),
                User.Create("Cajero Demo",      "cajero@demo.com",  hasher.Hash("Cajero2026!"),  UserRole.Cashier,     tenantId, branchId, branchName: branchName, tenantName: tenantName),
                User.Create("Carlos Restrepo", "carlos@demo.com",  hasher.Hash("Stylist2026!"), UserRole.Stylist,     tenantId, branchId, commissionPercent: 50,  branchName: branchName, tenantName: tenantName),
                User.Create("María López",     "maria@demo.com",   hasher.Hash("Stylist2026!"), UserRole.Stylist,     tenantId, branchId, commissionPercent: 45,  branchName: branchName, tenantName: tenantName),
                User.Create("Andrés Gómez",    "andres@demo.com",  hasher.Hash("Stylist2026!"), UserRole.Stylist,     tenantId, branchId, commissionPercent: 40,  branchName: branchName, tenantName: tenantName),
            };

            await identityDb.Users.AddRangeAsync(users);
            await identityDb.SaveChangesAsync();
            logger.LogInformation("✓ Usuarios demo creados para tenant {Id}", tenantId);
        }
        else
        {
            // Patch existing users that were created before BranchName/TenantName columns existed
            var usersToFix = await identityDb.Users
                .Where(u => u.TenantId == tenantId && (u.BranchName == null || u.TenantName == null))
                .ToListAsync();

            if (usersToFix.Count > 0)
            {
                foreach (var u in usersToFix)
                    u.SetLocationInfo(branchName, tenantName);
                await identityDb.SaveChangesAsync();
                logger.LogInformation("✓ Actualizados {Count} usuarios con BranchName/TenantName", usersToFix.Count);
            }
        }

        // ── 3. Métodos de pago (upsert — crea los que faltan, corrige % de los existentes) ──
        var pmDefaults = new (string Name, bool HasDeduction, decimal Pct)[]
        {
            ("Efectivo",        false, 0m),
            ("Nequi",           false, 0m),
            ("Daviplata",       false, 0m),
            ("Transferencia",   false, 0m),
            ("Tarjeta débito",  true,  7m),
            ("Tarjeta crédito", true,  7m),
        };

        var existingPMs = await salonDb.PaymentMethods
            .Where(p => p.TenantId == tenantId)
            .ToListAsync();
        var pmDict = existingPMs.ToDictionary(m => m.Name.Trim(), StringComparer.OrdinalIgnoreCase);

        foreach (var (name, hasDed, pct) in pmDefaults)
        {
            if (pmDict.TryGetValue(name, out var existing))
                existing.Update(name, hasDed, pct);   // sincroniza % si cambió
            else
                await salonDb.PaymentMethods.AddAsync(PaymentMethod.Create(tenantId, name, hasDed, pct));
        }
        await salonDb.SaveChangesAsync();
        logger.LogInformation("✓ Métodos de pago sincronizados para tenant {Id}", tenantId);

        // ── 4. Servicios por sede ────────────────────────────────────────────
        if (!await salonDb.SalonServices.AnyAsync(s => s.TenantId == tenantId && s.BranchId == branchId))
        {
            var servicios = new[]
            {
                SalonService.Create(tenantId, branchId, "Corte dama",        "Corte",      35_000m, hasSalonFee: false, 0m),
                SalonService.Create(tenantId, branchId, "Corte hombre",      "Corte",      25_000m, hasSalonFee: false, 0m),
                SalonService.Create(tenantId, branchId, "Tintura completa",  "Tintura",    80_000m, hasSalonFee: true,  4.5m),
                SalonService.Create(tenantId, branchId, "Manicure",          "Manos",      30_000m, hasSalonFee: false, 0m),
                SalonService.Create(tenantId, branchId, "Pedicure",          "Pies",       35_000m, hasSalonFee: false, 0m),
                SalonService.Create(tenantId, branchId, "Barba",             "Barba",      20_000m, hasSalonFee: false, 0m),
                SalonService.Create(tenantId, branchId, "Alisado",           "Tratamiento",120_000m,hasSalonFee: true,  4.5m),
                SalonService.Create(tenantId, branchId, "Hidratación",       "Tratamiento", 60_000m,hasSalonFee: false, 0m),
            };

            await salonDb.SalonServices.AddRangeAsync(servicios);
            await salonDb.SaveChangesAsync();
            logger.LogInformation("✓ Servicios creados para branch {Id}", branchId);
        }

        // ── 5. Productos por sede ────────────────────────────────────────────
        if (!await salonDb.SalonProducts.AnyAsync(p => p.TenantId == tenantId && p.BranchId == branchId))
        {
            var productos = new[]
            {
                SalonProduct.Create(tenantId, branchId, "Shampoo Loreal",      "Loreal",       "Cabello",    18_000m, 32_000m, 15, isForSale: true),
                SalonProduct.Create(tenantId, branchId, "Tinte Igora Royal",   "Schwarzkopf",  "Tintura",    12_000m, 0m,      20, isForSale: false),
                SalonProduct.Create(tenantId, branchId, "Oxidante 20vol",      "Schwarzkopf",  "Tintura",     8_000m, 0m,      30, isForSale: false),
                SalonProduct.Create(tenantId, branchId, "Mascarilla Keratina", "Loreal",       "Tratamiento",22_000m, 45_000m,  8, isForSale: true),
                SalonProduct.Create(tenantId, branchId, "Aceite Argán",        "Moroccanoil",  "Tratamiento",35_000m, 65_000m,  5, isForSale: true),
                SalonProduct.Create(tenantId, branchId, "Decolorante",         "Schwarzkopf",  "Tintura",    15_000m, 0m,      12, isForSale: false),
            };

            await salonDb.SalonProducts.AddRangeAsync(productos);
            await salonDb.SaveChangesAsync();
            logger.LogInformation("✓ Productos creados para branch {Id}", branchId);
        }

        logger.LogInformation("✓ SalonOpsSeeder completado — tenant demo listo.");
    }
}
