using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SalonPro.Identity.Domain.Interfaces;
using SalonPro.Identity.Infrastructure.Data;
using SalonPro.Identity.Infrastructure.Repositories;
using SalonPro.Identity.Infrastructure.Services;
using SalonPro.Shared.Interfaces;

namespace SalonPro.Identity.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddIdentityInfrastructure(this IServiceCollection services, IConfiguration config)
    {
        services.AddDbContext<IdentityDbContext>(opt =>
            opt.UseSqlServer(config.GetConnectionString("DefaultConnection")));

        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IPasswordHasher, BcryptPasswordHasher>();
        services.AddScoped<IJwtService, JwtService>();
        services.AddScoped<IUserProvisioningService, UserProvisioningService>();

        return services;
    }
}
