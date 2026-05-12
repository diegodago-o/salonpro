using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SalonPro.SalonOperations.Domain.Interfaces;
using SalonPro.SalonOperations.Infrastructure.Data;
using SalonPro.SalonOperations.Infrastructure.Repositories;

namespace SalonPro.SalonOperations.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddSalonOperationsInfrastructure(
        this IServiceCollection services, IConfiguration config)
    {
        services.AddDbContext<SalonOpsDbContext>(opt =>
            opt.UseSqlServer(config.GetConnectionString("DefaultConnection")));

        services.AddScoped<ISalonServiceRepository, SalonServiceRepository>();
        services.AddScoped<ISalonProductRepository, SalonProductRepository>();
        services.AddScoped<IClientRepository, ClientRepository>();
        services.AddScoped<IPaymentMethodRepository, PaymentMethodRepository>();
        services.AddScoped<ISaleRepository, SaleRepository>();
        services.AddScoped<ICashRegisterRepository, CashRegisterRepository>();
        services.AddScoped<IAnticipoRepository, AnticipoRepository>();
        services.AddScoped<ILiquidacionRepository, LiquidacionRepository>();

        return services;
    }
}
