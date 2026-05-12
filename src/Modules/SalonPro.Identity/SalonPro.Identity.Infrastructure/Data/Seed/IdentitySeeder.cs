using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using SalonPro.Identity.Domain.Entities;
using SalonPro.Identity.Domain.Enums;
using SalonPro.Identity.Domain.Interfaces;
using SalonPro.Identity.Infrastructure.Data;

namespace SalonPro.Identity.Infrastructure.Data.Seed;

public static class IdentitySeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        await using var scope = services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<IdentityDbContext>();
        var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<IdentityDbContext>>();

        await db.Database.MigrateAsync();

        if (!await db.Users.AnyAsync(u => u.Role == UserRole.PlatformAdmin))
        {
            var admin = User.Create(
                fullName: "Administrador SalonPro",
                email: "admin@salonpro.com.co",
                passwordHash: hasher.Hash("Admin2026!"),
                role: UserRole.PlatformAdmin);

            await db.Users.AddAsync(admin);
            await db.SaveChangesAsync();
            logger.LogInformation("✓ Usuario PlatformAdmin creado: admin@salonpro.com.co / Admin2026!");
        }
        else
        {
            logger.LogInformation("PlatformAdmin ya existe — seed omitido.");
        }
    }
}
