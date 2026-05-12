using MediatR;
using SalonPro.SalonOperations.Application.DTOs;
using SalonPro.SalonOperations.Domain.Interfaces;
using SalonPro.Shared.Exceptions;

namespace SalonPro.SalonOperations.Application.Commands;

public record UpdateServiceCommand(int Id, CreateServiceRequest Request) : IRequest<SalonServiceDto>;

public class UpdateServiceHandler(ISalonServiceRepository repo)
    : IRequestHandler<UpdateServiceCommand, SalonServiceDto>
{
    public async Task<SalonServiceDto> Handle(UpdateServiceCommand cmd, CancellationToken ct)
    {
        var service = await repo.GetByIdAsync(cmd.Id, ct)
            ?? throw new NotFoundException("SalonService", cmd.Id);
        var req = cmd.Request;
        service.Update(req.Name, req.Category, req.Price, req.HasSalonFee, req.SalonFeePercent);
        await repo.SaveChangesAsync(ct);
        return new SalonServiceDto(service.Id, service.Name, service.Category,
            service.Price, service.HasSalonFee, service.SalonFeePercent, service.IsActive);
    }
}
