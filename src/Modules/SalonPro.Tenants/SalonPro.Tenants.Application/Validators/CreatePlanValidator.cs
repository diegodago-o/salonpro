using FluentValidation;
using SalonPro.Tenants.Application.DTOs;

namespace SalonPro.Tenants.Application.Validators;

public class CreatePlanValidator : AbstractValidator<CreatePlanRequest>
{
    public CreatePlanValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.MaxBranches).GreaterThan(0);
        RuleFor(x => x.PriceMonthly).GreaterThanOrEqualTo(0);
        RuleFor(x => x.PricePerExtra).GreaterThanOrEqualTo(0);
    }
}
