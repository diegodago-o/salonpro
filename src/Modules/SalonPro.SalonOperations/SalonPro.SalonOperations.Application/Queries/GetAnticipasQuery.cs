using MediatR;
using SalonPro.SalonOperations.Application.DTOs;
using SalonPro.SalonOperations.Domain.Enums;
using SalonPro.SalonOperations.Domain.Interfaces;

namespace SalonPro.SalonOperations.Application.Queries;

public record GetAnticipasQuery(int TenantId, AnticipoStatus? Status = null) : IRequest<IEnumerable<AnticipoDto>>;

public class GetAnticipasHandler(IAnticipoRepository repo)
    : IRequestHandler<GetAnticipasQuery, IEnumerable<AnticipoDto>>
{
    public async Task<IEnumerable<AnticipoDto>> Handle(GetAnticipasQuery query, CancellationToken ct)
    {
        var anticipos = await repo.GetAllByTenantAsync(query.TenantId, query.Status, ct);
        return anticipos.Select(a => new AnticipoDto(
            a.Id, a.ClientName, a.ClientDocument, a.ClientPhone,
            a.Amount, a.PaymentMethodName, a.Notes,
            a.CreatedAt.ToString("o"), a.Status.ToString()));
    }
}
