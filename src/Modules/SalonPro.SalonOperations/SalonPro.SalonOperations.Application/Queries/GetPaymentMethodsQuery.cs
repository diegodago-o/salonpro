using MediatR;
using SalonPro.SalonOperations.Application.DTOs;
using SalonPro.SalonOperations.Domain.Interfaces;

namespace SalonPro.SalonOperations.Application.Queries;

public record GetPaymentMethodsQuery(int TenantId, bool includeInactive = false) : IRequest<IEnumerable<PaymentMethodDto>>;

public class GetPaymentMethodsHandler(IPaymentMethodRepository repo)
    : IRequestHandler<GetPaymentMethodsQuery, IEnumerable<PaymentMethodDto>>
{
    public async Task<IEnumerable<PaymentMethodDto>> Handle(GetPaymentMethodsQuery query, CancellationToken ct)
    {
        var methods = await repo.GetAllByTenantAsync(query.TenantId, ct, onlyActive: !query.includeInactive);
        return methods.Select(m => new PaymentMethodDto(m.Id, m.Name, m.HasDeduction, m.DeductionPercent, m.IsActive));
    }
}

// ── Toggle ───────────────────────────────────────────────────────────────
public record TogglePaymentMethodQuery(int TenantId, int MethodId) : IRequest<PaymentMethodDto>;

public class TogglePaymentMethodHandler(IPaymentMethodRepository repo)
    : IRequestHandler<TogglePaymentMethodQuery, PaymentMethodDto>
{
    public async Task<PaymentMethodDto> Handle(TogglePaymentMethodQuery query, CancellationToken ct)
    {
        var method = await repo.GetByIdAsync(query.MethodId, ct)
            ?? throw new KeyNotFoundException($"Método de pago {query.MethodId} no encontrado.");

        if (method.TenantId != query.TenantId)
            throw new UnauthorizedAccessException();

        repo.Toggle(method, !method.IsActive);
        await repo.SaveChangesAsync(ct);
        return new PaymentMethodDto(method.Id, method.Name, method.HasDeduction, method.DeductionPercent, method.IsActive);
    }
}
