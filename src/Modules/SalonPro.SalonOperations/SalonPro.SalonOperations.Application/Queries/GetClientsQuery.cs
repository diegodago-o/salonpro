using MediatR;
using SalonPro.SalonOperations.Application.DTOs;
using SalonPro.SalonOperations.Domain.Interfaces;

namespace SalonPro.SalonOperations.Application.Queries;

public record GetClientsQuery(int TenantId) : IRequest<IEnumerable<ClientDto>>;

public class GetClientsHandler(IClientRepository repo)
    : IRequestHandler<GetClientsQuery, IEnumerable<ClientDto>>
{
    public async Task<IEnumerable<ClientDto>> Handle(GetClientsQuery query, CancellationToken ct)
    {
        var clients = await repo.GetAllByTenantAsync(query.TenantId, ct);
        return clients.Select(c => new ClientDto(
            c.Id, c.DocumentType, c.DocumentNumber, c.FullName,
            c.Email, c.Phone, c.TotalVisits, c.TotalSpent, c.LastVisit, c.CreatedAt));
    }
}
