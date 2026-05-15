using MediatR;
using SalonPro.Shared.Exceptions;
using SalonPro.Shared.Interfaces;
using SalonPro.Tenants.Domain.Interfaces;

namespace SalonPro.Tenants.Application.Queries.Tenants;

public record TenantOwnerDto(
    int Id,
    string FullName,
    string Email,
    string? Phone,
    string? DocumentType,
    string? DocumentNumber,
    bool IsActive,
    DateTime CreatedAt);

public record GetTenantOwnerQuery(int TenantId) : IRequest<TenantOwnerDto>;

public class GetTenantOwnerHandler(
    ITenantRepository tenantRepo,
    IUserProvisioningService userProvisioning)
    : IRequestHandler<GetTenantOwnerQuery, TenantOwnerDto>
{
    public async Task<TenantOwnerDto> Handle(GetTenantOwnerQuery query, CancellationToken ct)
    {
        var tenant = await tenantRepo.GetByIdAsync(query.TenantId, ct)
            ?? throw new NotFoundException("Tenant", query.TenantId);

        var owner = await userProvisioning.GetTenantOwnerAsync(query.TenantId, ct)
            ?? throw new NotFoundException("Administrador del tenant", query.TenantId);

        return new TenantOwnerDto(
            owner.Id, owner.FullName, owner.Email,
            owner.Phone, owner.DocumentType, owner.DocumentNumber,
            owner.IsActive, owner.CreatedAt);
    }
}
