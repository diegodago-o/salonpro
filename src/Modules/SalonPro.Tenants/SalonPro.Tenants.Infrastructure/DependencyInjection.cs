using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SalonPro.Shared.Interfaces;
using SalonPro.Tenants.Domain.Interfaces;
using SalonPro.Tenants.Infrastructure.Data;
using SalonPro.Tenants.Infrastructure.Repositories;
using SalonPro.Tenants.Infrastructure.Services;

namespace SalonPro.Tenants.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddTenantsInfrastructure(this IServiceCollection services, IConfiguration config)
    {
        services.AddDbContext<TenantsDbContext>(opt =>
            opt.UseSqlServer(config.GetConnectionString("DefaultConnection")));

        services.AddScoped<ITenantRepository, TenantRepository>();
        services.AddScoped<IPlanRepository, PlanRepository>();
        services.AddScoped<ISubscriptionRepository, SubscriptionRepository>();
        services.AddScoped<IBranchRepository, BranchRepository>();

        services.AddScoped<ITenantService, TenantService>();
        services.AddScoped<IBranchService, BranchService>();

        return services;
    }
}
