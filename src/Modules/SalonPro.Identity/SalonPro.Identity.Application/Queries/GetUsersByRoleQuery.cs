using MediatR;
using SalonPro.Identity.Application.DTOs;
using SalonPro.Identity.Domain.Enums;
using SalonPro.Identity.Domain.Interfaces;

namespace SalonPro.Identity.Application.Queries;

public record GetUsersByRoleQuery(int TenantId, string Role) : IRequest<IEnumerable<UserDto>>;

public class GetUsersByRoleHandler(IUserRepository userRepo)
    : IRequestHandler<GetUsersByRoleQuery, IEnumerable<UserDto>>
{
    public async Task<IEnumerable<UserDto>> Handle(GetUsersByRoleQuery query, CancellationToken ct)
    {
        var users = await userRepo.GetByTenantAsync(query.TenantId, ct);

        if (Enum.TryParse<UserRole>(query.Role, ignoreCase: true, out var role))
            users = users.Where(u => u.Role == role);

        return users.Select(u => new UserDto(
            u.Id, u.FullName, u.Email, u.Role.ToString(),
            u.TenantId, u.BranchId, u.CommissionPercent,
            u.BranchName, u.TenantName, u.IsActive, u.EmployeeCode));
    }
}
