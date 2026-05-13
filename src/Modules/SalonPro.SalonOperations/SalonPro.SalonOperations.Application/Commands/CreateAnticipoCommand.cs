using MediatR;
using SalonPro.SalonOperations.Application.DTOs;
using SalonPro.SalonOperations.Domain.Entities;
using SalonPro.SalonOperations.Domain.Interfaces;
using SalonPro.Shared.Exceptions;

namespace SalonPro.SalonOperations.Application.Commands;

public record CreateAnticipoRequest(
    string ClientDocumentType,
    string ClientDocumentNumber,
    string ClientFullName,
    string ClientPhone,
    decimal Amount,
    int PaymentMethodId,
    string? Notes);

public record CreateAnticipoCommand(int TenantId, int? BranchId, CreateAnticipoRequest Request) : IRequest<AnticipoDto>;

public class CreateAnticipoHandler(IAnticipoRepository repo, IClientRepository clientRepo, IPaymentMethodRepository pmRepo)
    : IRequestHandler<CreateAnticipoCommand, AnticipoDto>
{
    public async Task<AnticipoDto> Handle(CreateAnticipoCommand cmd, CancellationToken ct)
    {
        var req = cmd.Request;

        var method = await pmRepo.GetByIdAsync(req.PaymentMethodId, ct)
            ?? throw new NotFoundException("PaymentMethod", req.PaymentMethodId);

        // Try to link to existing client
        var client = await clientRepo.GetByDocumentAsync(cmd.TenantId, req.ClientDocumentNumber, ct);

        var anticipo = Anticipo.Create(
            cmd.TenantId,
            cmd.BranchId,
            client?.Id,
            req.ClientFullName,
            req.ClientDocumentNumber,
            req.ClientPhone,
            req.Amount,
            method.Id,
            method.Name,
            req.Notes);

        await repo.AddAsync(anticipo, ct);
        await repo.SaveChangesAsync(ct);

        return new AnticipoDto(anticipo.Id, anticipo.ClientName, anticipo.ClientDocument,
            anticipo.ClientPhone, anticipo.Amount, anticipo.PaymentMethodName,
            anticipo.Notes, anticipo.CreatedAt.ToString("o"), anticipo.Status.ToString());
    }
}
