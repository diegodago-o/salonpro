using MediatR;
using SalonPro.SalonOperations.Application.DTOs;
using SalonPro.SalonOperations.Domain.Entities;
using SalonPro.SalonOperations.Domain.Interfaces;
using SalonPro.SalonOperations.Domain.Enums;
using SalonPro.Shared.Exceptions;

namespace SalonPro.SalonOperations.Application.Commands;

public record CloseCashRegisterRequest(decimal DeclaredCash, string? Notes);

public record CloseCashRegisterCommand(int Id, int TenantId, CloseCashRegisterRequest Request) : IRequest<CashRegisterDto>;

public class CloseCashRegisterHandler(ICashRegisterRepository cashRepo, ISaleRepository saleRepo)
    : IRequestHandler<CloseCashRegisterCommand, CashRegisterDto>
{
    public async Task<CashRegisterDto> Handle(CloseCashRegisterCommand cmd, CancellationToken ct)
    {
        var cr = await cashRepo.GetByIdWithDetailsAsync(cmd.Id, ct)
            ?? throw new NotFoundException("CashRegister", cmd.Id);
        if (cr.TenantId != cmd.TenantId) throw new ForbiddenException();

        if (cr.Status == CashRegisterStatus.Closed)
            throw new ConflictException("La caja ya está cerrada.");

        // Calculate expected cash from today's sales — filtrado por la sede de esta caja
        var sales = await saleRepo.GetByTenantAndDateRangeAsync(
            cr.TenantId, cr.OpenedAt, DateTime.UtcNow, branchId: cr.BranchId, ct: ct);

        var activeSales = sales.Where(s => s.Status == SaleStatus.Active).ToList();

        // Group payments by method to build details
        var paymentGroups = activeSales
            .SelectMany(s => s.Payments)
            .GroupBy(p => new { p.PaymentMethodId, p.PaymentMethodName })
            .ToList();

        var details = new List<CashRegisterDetail>();

        // expectedCash = dinero físico que debería haber en la caja al cierre.
        // Solo el Efectivo ingresa al cajón físico.
        // Tarjeta, Nequi, Daviplata, Transferencia, etc. van al sistema bancario, NO al cajón.
        // Las deducciones (comisiones bancarias) ya están CONTENIDAS dentro del totalAmount;
        // no se restan aquí porque no reducen el físico que tiene el cajero en mano.
        decimal expectedCash = cr.OpeningBalance;

        foreach (var group in paymentGroups)
        {
            var totalAmount = group.Sum(p => p.Amount);
            var totalDeductions = group.Sum(p => p.DeductionAmount);
            var detail = CashRegisterDetail.Create(cr.Id, group.Key.PaymentMethodId,
                group.Key.PaymentMethodName, totalAmount, totalDeductions);
            details.Add(detail);

            // Solo el efectivo suma al físico de caja
            if (group.Key.PaymentMethodName.Equals("Efectivo", StringComparison.OrdinalIgnoreCase))
                expectedCash += totalAmount;
        }

        cr.Close(cmd.Request.DeclaredCash, expectedCash, cmd.Request.Notes);

        // Add details to the CashRegister entity
        foreach (var d in details)
            cr.Details.Add(d);

        await cashRepo.SaveChangesAsync(ct);
        return Queries.GetCurrentCashRegisterHandler.MapToDto(cr);
    }
}
