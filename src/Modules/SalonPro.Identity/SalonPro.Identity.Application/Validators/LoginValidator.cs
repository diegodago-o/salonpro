using FluentValidation;
using SalonPro.Identity.Application.DTOs;

namespace SalonPro.Identity.Application.Validators;

public class LoginValidator : AbstractValidator<LoginRequest>
{
    public LoginValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).NotEmpty();
    }
}

public class CreateUserValidator : AbstractValidator<CreateUserRequest>
{
    public CreateUserValidator()
    {
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(150);
        RuleFor(x => x.Password).NotEmpty().MinimumLength(8);
        RuleFor(x => x.Role).NotEmpty()
            .Must(r => new[] { "PlatformAdmin", "TenantOwner", "Cashier", "Stylist" }.Contains(r))
            .WithMessage("Rol inválido.");
        RuleFor(x => x.CommissionPercent).InclusiveBetween(0, 100);
    }
}
