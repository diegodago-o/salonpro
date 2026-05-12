using MediatR;
using SalonPro.SalonOperations.Application.DTOs;
using SalonPro.SalonOperations.Domain.Interfaces;
using SalonPro.Shared.Exceptions;

namespace SalonPro.SalonOperations.Application.Queries;

public record GetCashRegisterDetailQuery(int Id) : IRequest<CashRegisterDto>;

public class GetCashRegisterDetailHandler(ICashRegisterRepository repo)
    : IRequestHandler<GetCashRegisterDetailQuery, CashRegisterDto>
{
    public async Task<CashRegisterDto> Handle(GetCashRegisterDetailQuery query, CancellationToken ct)
    {
        var cr = await repo.GetByIdWithDetailsAsync(query.Id, ct)
            ?? throw new NotFoundException("CashRegister", query.Id);
        return GetCurrentCashRegisterHandler.MapToDto(cr);
    }
}
