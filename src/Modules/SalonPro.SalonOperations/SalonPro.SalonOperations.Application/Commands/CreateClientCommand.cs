using MediatR;
using SalonPro.SalonOperations.Application.DTOs;
using SalonPro.SalonOperations.Domain.Entities;
using SalonPro.SalonOperations.Domain.Interfaces;

namespace SalonPro.SalonOperations.Application.Commands;

public record CreateClientRequest(
    string DocumentType,
    string DocumentNumber,
    string FullName,
    string? Email,
    string Phone);

public record CreateClientCommand(int TenantId, CreateClientRequest Request) : IRequest<ClientDto>;

public class CreateClientHandler(IClientRepository repo)
    : IRequestHandler<CreateClientCommand, ClientDto>
{
    public async Task<ClientDto> Handle(CreateClientCommand cmd, CancellationToken ct)
    {
        var req = cmd.Request;
        var client = Client.Create(cmd.TenantId, req.DocumentType, req.DocumentNumber,
            req.FullName, req.Email, req.Phone);
        await repo.AddAsync(client, ct);
        await repo.SaveChangesAsync(ct);
        return new ClientDto(client.Id, client.DocumentType, client.DocumentNumber,
            client.FullName, client.Email, client.Phone,
            client.TotalVisits, client.TotalSpent, client.LastVisit, client.CreatedAt);
    }
}
