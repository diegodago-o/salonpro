using MediatR;
using SalonPro.Identity.Application.DTOs;
using SalonPro.Identity.Domain.Enums;
using SalonPro.Identity.Domain.Interfaces;
using SalonPro.Shared.Exceptions;

namespace SalonPro.Identity.Application.Commands;

public record UpdateUserAdminCommand(int UserId, int TenantId, UpdateUserAdminRequest Request)
    : IRequest<UserDto>;

public class UpdateUserAdminHandler(IUserRepository userRepo)
    : IRequestHandler<UpdateUserAdminCommand, UserDto>
{
    public async Task<UserDto> Handle(UpdateUserAdminCommand cmd, CancellationToken ct)
    {
        var user = await userRepo.GetByIdAsync(cmd.UserId, ct)
            ?? throw new NotFoundException("User", cmd.UserId);

        if (user.TenantId != cmd.TenantId)
            throw new ForbiddenException("No tienes permisos para modificar este usuario.");

        if (user.Role == UserRole.TenantOwner)
            throw new ForbiddenException("No se puede editar al dueño del salón desde este panel.");

        if (!Enum.TryParse<UserRole>(cmd.Request.Role, ignoreCase: true, out var role)
            || role == UserRole.TenantOwner)
            throw new BadRequestException($"Rol inválido: {cmd.Request.Role}");

        user.UpdateAdminFields(
            cmd.Request.FullName,
            role,
            cmd.Request.BranchId,
            cmd.Request.BranchName,
            cmd.Request.CommissionPercent,
            cmd.Request.EmployeeCode);

        await userRepo.SaveChangesAsync(ct);

        return new UserDto(user.Id, user.FullName, user.Email, user.Role.ToString(),
            user.TenantId, user.BranchId, user.CommissionPercent,
            user.BranchName, user.TenantName, user.IsActive, user.EmployeeCode);
    }
}
