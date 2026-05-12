using MediatR;
using SalonPro.SalonOperations.Application.DTOs;
using SalonPro.SalonOperations.Domain.Interfaces;

namespace SalonPro.SalonOperations.Application.Queries;

public record GetCashRegisterHistoryQuery(int TenantId) : IRequest<IEnumerable<CashRegisterDto>>;

public class GetCashRegisterHistoryHandler(ICashRegisterRepository repo)
    : IRequestHandler<GetCashRegisterHistoryQuery, IEnumerable<CashRegisterDto>>
{
    public async Task<IEnumerable<CashRegisterDto>> Handle(GetCashRegisterHistoryQuery query, CancellationToken ct)
    {
        var registers = await repo.GetAllByTenantAsync(query.TenantId, ct);
        return registers.Select(GetCurrentCashRegisterHandler.MapToDto);
    }
}
