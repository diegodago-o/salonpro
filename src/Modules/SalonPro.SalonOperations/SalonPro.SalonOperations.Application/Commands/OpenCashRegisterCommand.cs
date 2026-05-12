using MediatR;
using SalonPro.SalonOperations.Application.DTOs;
using SalonPro.SalonOperations.Domain.Entities;
using SalonPro.SalonOperations.Domain.Interfaces;
using SalonPro.Shared.Exceptions;

namespace SalonPro.SalonOperations.Application.Commands;

public record OpenCashRegisterRequest(decimal OpeningBalance, string? Notes);

public record OpenCashRegisterCommand(int TenantId, int BranchId, string BranchName, int CashierId, string CashierName, OpenCashRegisterRequest Request)
    : IRequest<CashRegisterDto>;

public class OpenCashRegisterHandler(ICashRegisterRepository repo)
    : IRequestHandler<OpenCashRegisterCommand, CashRegisterDto>
{
    public async Task<CashRegisterDto> Handle(OpenCashRegisterCommand cmd, CancellationToken ct)
    {
        // Ensure no currently open register for this tenant
        var existing = await repo.GetCurrentOpenByTenantAsync(cmd.TenantId, ct);
        if (existing is not null)
            throw new ConflictException("Ya existe una caja abierta para este tenant.");

        var req = cmd.Request;
        var cr = CashRegister.Open(cmd.TenantId, cmd.BranchId, cmd.BranchName,
            cmd.CashierId, cmd.CashierName, req.OpeningBalance, req.Notes);
        await repo.AddAsync(cr, ct);
        await repo.SaveChangesAsync(ct);
        return Queries.GetCurrentCashRegisterHandler.MapToDto(cr);
    }
}
