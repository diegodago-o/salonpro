using FluentValidation;
using SalonPro.Tenants.Application.DTOs;

namespace SalonPro.Tenants.Application.Validators;

public class CreateBranchValidator : AbstractValidator<CreateBranchRequest>
{
    public CreateBranchValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(150);
        RuleFor(x => x.Phone).MaximumLength(20).When(x => x.Phone is not null);
        RuleFor(x => x.City).MaximumLength(100).When(x => x.City is not null);
    }
}
