using MediatR;
using SalonPro.Identity.Domain.Interfaces;

namespace SalonPro.Identity.Application.Commands;

public record LogoutCommand(int UserId) : IRequest;

public class LogoutHandler(IUserRepository userRepo) : IRequestHandler<LogoutCommand>
{
    public async Task Handle(LogoutCommand cmd, CancellationToken ct)
    {
        var user = await userRepo.GetByIdAsync(cmd.UserId, ct);
        if (user is null) return;
        user.RevokeRefreshToken();
        await userRepo.SaveChangesAsync(ct);
    }
}
