using MediatR;
using SalonPro.SalonOperations.Application.DTOs;
using SalonPro.SalonOperations.Domain.Entities;
using SalonPro.SalonOperations.Domain.Interfaces;

namespace SalonPro.SalonOperations.Application.Commands;

public record CreateAnticipoColaboradorRequest(
    int     StylistId,
    string  StylistName,
    decimal Amount,
    /// <summary>Fecha en formato yyyy-MM-dd.</summary>
    string  Date,
    string? Notes = null);

public record CreateAnticipoColaboradorCommand(
    int  TenantId,
    int? BranchId,
    CreateAnticipoColaboradorRequest Request) : IRequest<AnticipoColaboradorDto>;

public class CreateAnticipoColaboradorHandler(IAnticipoColaboradorRepository repo)
    : IRequestHandler<CreateAnticipoColaboradorCommand, AnticipoColaboradorDto>
{
    public async Task<AnticipoColaboradorDto> Handle(CreateAnticipoColaboradorCommand cmd, CancellationToken ct)
    {
        var req  = cmd.Request;
        var date = DateTime.TryParse(req.Date, out var d) ? d : DateTime.UtcNow;

        var anticipo = AnticipoColaborador.Create(
            cmd.TenantId, cmd.BranchId,
            req.StylistId, req.StylistName,
            req.Amount, date, req.Notes);

        await repo.AddAsync(anticipo, ct);
        await repo.SaveChangesAsync(ct);

        return ToDto(anticipo);
    }

    internal static AnticipoColaboradorDto ToDto(AnticipoColaborador a) => new(
        a.Id, a.StylistId, a.StylistName, a.Amount,
        a.Date.ToString("yyyy-MM-dd"),
        a.Notes, a.Status.ToString(), a.LiquidacionId,
        a.CreatedAt.ToString("o"));
}
