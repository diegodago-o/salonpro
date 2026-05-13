using MediatR;
using SalonPro.Identity.Domain.Interfaces;
using SalonPro.Shared.Exceptions;

namespace SalonPro.Identity.Application.Commands;

public record ToggleUserStatusCommand(int UserId, int TenantId) : IRequest<bool>;

public class ToggleUserStatusHandler(IUserRepository userRepo)
    : IRequestHandler<ToggleUserStatusCommand, bool>
{
    public async Task<bool> Handle(ToggleUserStatusCommand cmd, CancellationToken ct)
    {
        var user = await userRepo.GetByIdAsync(cmd.UserId, ct)
            ?? throw new NotFoundException("User", cmd.UserId);

        if (user.TenantId != cmd.TenantId)
            throw new ForbiddenException("No tienes permisos para modificar este usuario.");

        user.SetActive(!user.IsActive);
        await userRepo.SaveChangesAsync(ct);
        return user.IsActive;
    }
}
