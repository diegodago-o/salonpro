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

// ── Update ───────────────────────────────────────────────────────────────
public record UpdatePaymentMethodCommand(
    int TenantId, int MethodId,
    string Name, bool HasDeduction, decimal DeductionPercent) : IRequest<PaymentMethodDto>;

public class UpdatePaymentMethodHandler(IPaymentMethodRepository repo)
    : IRequestHandler<UpdatePaymentMethodCommand, PaymentMethodDto>
{
    public async Task<PaymentMethodDto> Handle(UpdatePaymentMethodCommand cmd, CancellationToken ct)
    {
        var method = await repo.GetByIdAsync(cmd.MethodId, ct)
            ?? throw new KeyNotFoundException($"Método de pago {cmd.MethodId} no encontrado.");

        if (method.TenantId != cmd.TenantId)
            throw new UnauthorizedAccessException();

        method.Update(
            string.IsNullOrWhiteSpace(cmd.Name) ? method.Name : cmd.Name.Trim(),
            cmd.HasDeduction,
            cmd.HasDeduction ? Math.Max(0, Math.Min(100, cmd.DeductionPercent)) : 0);

        await repo.SaveChangesAsync(ct);
        return new PaymentMethodDto(method.Id, method.Name, method.HasDeduction, method.DeductionPercent, method.IsActive);
    }
}
