using MediatR;
using SalonPro.Identity.Application.DTOs;
using SalonPro.Identity.Domain.Entities;
using SalonPro.Identity.Domain.Enums;
using SalonPro.Identity.Domain.Interfaces;
using SalonPro.Shared.Exceptions;

namespace SalonPro.Identity.Application.Commands;

public record CreateUserCommand(CreateUserRequest Request) : IRequest<UserDto>;

public class CreateUserHandler(IUserRepository userRepo, IPasswordHasher hasher)
    : IRequestHandler<CreateUserCommand, UserDto>
{
    public async Task<UserDto> Handle(CreateUserCommand cmd, CancellationToken ct)
    {
        if (await userRepo.ExistsByEmailAsync(cmd.Request.Email, ct))
            throw new ConflictException($"El email '{cmd.Request.Email}' ya está registrado.");

        if (!Enum.TryParse<UserRole>(cmd.Request.Role, true, out var role))
            throw new ArgumentException($"Rol inválido: {cmd.Request.Role}");

        var hash = hasher.Hash(cmd.Request.Password);
        var user = User.Create(cmd.Request.FullName, cmd.Request.Email, hash, role,
            cmd.Request.TenantId, cmd.Request.BranchId,
            cmd.Request.DocumentType, cmd.Request.DocumentNumber,
            cmd.Request.Phone, cmd.Request.CommissionPercent,
            cmd.Request.BranchName, cmd.Request.TenantName);

        await userRepo.AddAsync(user, ct);
        await userRepo.SaveChangesAsync(ct);

        return new UserDto(user.Id, user.FullName, user.Email, user.Role.ToString(),
            user.TenantId, user.BranchId, user.CommissionPercent,
            user.BranchName, user.TenantName);
    }
}
