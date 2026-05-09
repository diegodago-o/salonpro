using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using SalonPro.Gateway.Middleware;
using SalonPro.Identity.Api;
using SalonPro.Identity.Application;
using SalonPro.Identity.Infrastructure;
using SalonPro.Identity.Infrastructure.Data.Seed;
using SalonPro.Tenants.Api;
using SalonPro.Tenants.Application;
using SalonPro.Tenants.Infrastructure;
using SalonPro.Tenants.Infrastructure.Data.Seed;
using System.Text;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    builder.Host.UseSerilog((ctx, lc) => lc
        .ReadFrom.Configuration(ctx.Configuration)
        .WriteTo.Console());

    // JWT
    var jwtSecret = builder.Configuration["Jwt:Secret"]
        ?? throw new InvalidOperationException("Jwt:Secret no configurado.");
    var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "SalonPro";
    var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "SalonProApp";

    builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(opt =>
        {
            opt.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = jwtIssuer,
                ValidAudience = jwtAudience,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret))
            };
        });

    builder.Services.AddAuthorization();

    // CORS
    builder.Services.AddCors(opt => opt.AddDefaultPolicy(policy =>
        policy.WithOrigins(
            builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ?? ["http://localhost:4200", "http://localhost:4300"])
        .AllowAnyHeader()
        .AllowAnyMethod()));

    // Módulos
    builder.Services.AddTenantsApplication();
    builder.Services.AddTenantsInfrastructure(builder.Configuration);
    builder.Services.AddIdentityApplication();
    builder.Services.AddIdentityInfrastructure(builder.Configuration);

    builder.Services.AddControllers()
        .AddTenantsApi()
        .AddIdentityApi();

    builder.Services.AddEndpointsApiExplorer();

    var app = builder.Build();

    // Seed datos iniciales en desarrollo
    if (app.Environment.IsDevelopment())
    {
        await TenantsSeeder.SeedAsync(app.Services);
        await IdentitySeeder.SeedAsync(app.Services);
    }

    app.UseMiddleware<ExceptionHandlingMiddleware>();
    app.UseHttpsRedirection();
    app.UseCors();
    app.UseAuthentication();
    app.UseAuthorization();
    app.UseMiddleware<TenantResolutionMiddleware>();
    app.MapControllers();

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "La aplicación falló al iniciar.");
}
finally
{
    Log.CloseAndFlush();
}
