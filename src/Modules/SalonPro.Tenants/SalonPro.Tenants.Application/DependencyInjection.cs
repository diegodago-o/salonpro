using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using System.Reflection;

namespace SalonPro.Tenants.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddTenantsApplication(this IServiceCollection services)
    {
        services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(Assembly.GetExecutingAssembly()));
        services.AddValidatorsFromAssembly(Assembly.GetExecutingAssembly());
        return services;
    }
}
