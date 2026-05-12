using Microsoft.Extensions.DependencyInjection;

namespace SalonPro.SalonOperations.Api;

public static class DependencyInjection
{
    public static IMvcBuilder AddSalonOperationsApi(this IMvcBuilder builder)
    {
        builder.AddApplicationPart(typeof(DependencyInjection).Assembly);
        return builder;
    }
}
