using Microsoft.Extensions.DependencyInjection;

namespace SalonPro.Tenants.Api;

public static class DependencyInjection
{
    public static IMvcBuilder AddTenantsApi(this IMvcBuilder builder)
    {
        builder.AddApplicationPart(typeof(DependencyInjection).Assembly);
        return builder;
    }
}
