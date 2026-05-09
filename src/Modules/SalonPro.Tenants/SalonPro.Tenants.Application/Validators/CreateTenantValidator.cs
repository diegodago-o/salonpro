using FluentValidation;
using SalonPro.Tenants.Application.DTOs;

namespace SalonPro.Tenants.Application.Validators;

public class CreateTenantValidator : AbstractValidator<CreateTenantRequest>
{
    public CreateTenantValidator()
    {
        RuleFor(x => x.BusinessName).NotEmpty().MaximumLength(150);
        RuleFor(x => x.Nit).NotEmpty().MaximumLength(20);
        RuleFor(x => x.Slug).NotEmpty().MaximumLength(50)
            .Matches(@"^[a-z0-9\-]+$").WithMessage("El subdominio solo puede contener letras minúsculas, números y guiones.");
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(150);
        RuleFor(x => x.PlanId).GreaterThan(0);
        RuleFor(x => x.ExtraBranches).GreaterThanOrEqualTo(0);
        RuleFor(x => x.BillingCycle).NotEmpty().Must(v => v is "Monthly" or "Annual")
            .WithMessage("BillingCycle debe ser Monthly o Annual.");
        RuleFor(x => x.BranchName).NotEmpty().MaximumLength(150);
        RuleFor(x => x.OwnerEmail).NotEmpty().EmailAddress();
        RuleFor(x => x.OwnerFullName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.OwnerPassword).NotEmpty().MinimumLength(8);
        RuleFor(x => x.OwnerDocument).NotEmpty().MaximumLength(20);
    }
}
