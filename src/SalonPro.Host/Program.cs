using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using SalonPro.Gateway.Middleware;
using SalonPro.Identity.Api;
using SalonPro.Identity.Application;
using SalonPro.Identity.Infrastructure;
using SalonPro.Identity.Infrastructure.Data.Seed;
using SalonPro.SalonOperations.Api;
using SalonPro.SalonOperations.Application;
using SalonPro.SalonOperations.Infrastructure;
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

    // CORS — en desarrollo permite todo, en producción solo orígenes configurados
    builder.Services.AddCors(opt => opt.AddDefaultPolicy(policy =>
    {
        if (builder.Environment.IsDevelopment())
            policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
        else
            policy.WithOrigins(
                builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ?? ["http://localhost:4200", "http://localhost:4300"])
            .AllowAnyHeader().AllowAnyMethod();
    }));

    // Módulos
    builder.Services.AddTenantsApplication();
    builder.Services.AddTenantsInfrastructure(builder.Configuration);
    builder.Services.AddIdentityApplication();
    builder.Services.AddIdentityInfrastructure(builder.Configuration);
    builder.Services.AddSalonOperationsApplication();
    builder.Services.AddSalonOperationsInfrastructure(builder.Configuration);

    builder.Services.AddControllers()
        .AddTenantsApi()
        .AddIdentityApi()
        .AddSalonOperationsApi();

    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(c =>
    {
        c.SwaggerDoc("v1", new() { Title = "SalonPro API", Version = "v1" });
        c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
        {
            Name = "Authorization",
            Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            In = Microsoft.OpenApi.Models.ParameterLocation.Header,
            Description = "Ingresa el token JWT"
        });
        c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
        {
            {
                new Microsoft.OpenApi.Models.OpenApiSecurityScheme
                {
                    Reference = new Microsoft.OpenApi.Models.OpenApiReference
                    { Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme, Id = "Bearer" }
                },
                []
            }
        });
    });

    var app = builder.Build();

    // Seed datos iniciales en desarrollo
    if (app.Environment.IsDevelopment())
    {
        await TenantsSeeder.SeedAsync(app.Services);
        await IdentitySeeder.SeedAsync(app.Services);
    }

    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "SalonPro API v1"));

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
