using MediatR;
using SalonPro.SalonOperations.Application.DTOs;
using SalonPro.SalonOperations.Domain.Entities;
using SalonPro.SalonOperations.Domain.Interfaces;

namespace SalonPro.SalonOperations.Application.Commands;

public record CreateServiceRequest(
    string Name,
    string Category,
    decimal Price,
    bool HasSalonFee,
    decimal SalonFeePercent);

public record CreateServiceCommand(int TenantId, CreateServiceRequest Request) : IRequest<SalonServiceDto>;

public class CreateServiceHandler(ISalonServiceRepository repo)
    : IRequestHandler<CreateServiceCommand, SalonServiceDto>
{
    public async Task<SalonServiceDto> Handle(CreateServiceCommand cmd, CancellationToken ct)
    {
        var req = cmd.Request;
        var service = SalonService.Create(cmd.TenantId, req.Name, req.Category,
            req.Price, req.HasSalonFee, req.SalonFeePercent);
        await repo.AddAsync(service, ct);
        await repo.SaveChangesAsync(ct);
        return new SalonServiceDto(service.Id, service.Name, service.Category,
            service.Price, service.HasSalonFee, service.SalonFeePercent, service.IsActive);
    }
}
