using MediatR;
using SalonPro.SalonOperations.Application.DTOs;
using SalonPro.SalonOperations.Domain.Interfaces;

namespace SalonPro.SalonOperations.Application.Queries;

public record GetPaymentMethodsQuery(int TenantId) : IRequest<IEnumerable<PaymentMethodDto>>;

public class GetPaymentMethodsHandler(IPaymentMethodRepository repo)
    : IRequestHandler<GetPaymentMethodsQuery, IEnumerable<PaymentMethodDto>>
{
    public async Task<IEnumerable<PaymentMethodDto>> Handle(GetPaymentMethodsQuery query, CancellationToken ct)
    {
        var methods = await repo.GetAllByTenantAsync(query.TenantId, ct);
        return methods.Select(m => new PaymentMethodDto(m.Id, m.Name, m.HasDeduction, m.DeductionPercent));
    }
}
