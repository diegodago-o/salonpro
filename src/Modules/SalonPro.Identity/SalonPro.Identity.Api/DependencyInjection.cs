using Microsoft.Extensions.DependencyInjection;

namespace SalonPro.Identity.Api;

public static class DependencyInjection
{
    public static IMvcBuilder AddIdentityApi(this IMvcBuilder builder)
    {
        builder.AddApplicationPart(typeof(DependencyInjection).Assembly);
        return builder;
    }
}
