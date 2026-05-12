using MediatR;
using SalonPro.SalonOperations.Application.DTOs;
using SalonPro.SalonOperations.Domain.Interfaces;

namespace SalonPro.SalonOperations.Application.Queries;

public record SearchClientByDocumentQuery(int TenantId, string DocumentNumber) : IRequest<ClientDto?>;

public class SearchClientByDocumentHandler(IClientRepository repo)
    : IRequestHandler<SearchClientByDocumentQuery, ClientDto?>
{
    public async Task<ClientDto?> Handle(SearchClientByDocumentQuery query, CancellationToken ct)
    {
        var client = await repo.GetByDocumentAsync(query.TenantId, query.DocumentNumber, ct);
        if (client is null) return null;
        return new ClientDto(
            client.Id, client.DocumentType, client.DocumentNumber, client.FullName,
            client.Email, client.Phone, client.TotalVisits, client.TotalSpent,
            client.LastVisit, client.CreatedAt);
    }
}
