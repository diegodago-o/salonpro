using MediatR;
using SalonPro.SalonOperations.Application.DTOs;
using SalonPro.SalonOperations.Domain.Interfaces;
using SalonPro.Shared.Exceptions;

namespace SalonPro.SalonOperations.Application.Commands;

public record UpdateClientCommand(int Id, CreateClientRequest Request) : IRequest<ClientDto>;

public class UpdateClientHandler(IClientRepository repo)
    : IRequestHandler<UpdateClientCommand, ClientDto>
{
    public async Task<ClientDto> Handle(UpdateClientCommand cmd, CancellationToken ct)
    {
        var client = await repo.GetByIdAsync(cmd.Id, ct)
            ?? throw new NotFoundException("Client", cmd.Id);
        var req = cmd.Request;
        client.Update(req.DocumentType, req.DocumentNumber, req.FullName, req.Email, req.Phone);
        await repo.SaveChangesAsync(ct);
        return new ClientDto(client.Id, client.DocumentType, client.DocumentNumber,
            client.FullName, client.Email, client.Phone,
            client.TotalVisits, client.TotalSpent, client.LastVisit, client.CreatedAt);
    }
}
