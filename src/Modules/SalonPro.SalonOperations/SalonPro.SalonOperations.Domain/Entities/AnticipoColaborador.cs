using SalonPro.SalonOperations.Domain.Enums;

namespace SalonPro.SalonOperations.Domain.Entities;

public class AnticipoColaborador
{
    public int Id { get; private set; }
    public int TenantId { get; private set; }
    public int? BranchId { get; private set; }
    public int StylistId { get; private set; }
    public string StylistName { get; private set; } = string.Empty;
    public decimal Amount { get; private set; }
    /// <summary>Fecha en que se entregó el anticipo (solo fecha, sin hora).</summary>
    public DateTime Date { get; private set; }
    public string? Notes { get; private set; }
    public AnticipoColaboradorStatus Status { get; private set; }
    /// <summary>
    /// Liquidación a la que está reservado o en la que fue aplicado.
    /// Null = libre (no vinculado a ninguna liquidación).
    /// </summary>
    public int? LiquidacionId { get; private set; }
    public DateTime CreatedAt { get; private set; }

    private AnticipoColaborador() { }

    public static AnticipoColaborador Create(
        int tenantId, int? branchId,
        int stylistId, string stylistName,
        decimal amount, DateTime date, string? notes)
    {
        return new AnticipoColaborador
        {
            TenantId   = tenantId,
            BranchId   = branchId,
            StylistId  = stylistId,
            StylistName = stylistName.Trim(),
            Amount     = amount,
            Date       = date.Date,
            Notes      = notes?.Trim(),
            Status     = AnticipoColaboradorStatus.Pendiente,
            CreatedAt  = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Reserva este anticipo para una liquidación concreta.
    /// Garantiza cruce único: una vez reservado no puede ser recogido por otra liquidación.
    /// </summary>
    public void Reserve(int liquidacionId)
    {
        if (Status != AnticipoColaboradorStatus.Pendiente)
            throw new InvalidOperationException("Solo se pueden reservar anticipos en estado Pendiente.");
        LiquidacionId = liquidacionId;
    }

    /// <summary>Marca el anticipo como aplicado al cerrar la liquidación.</summary>
    public void Apply() => Status = AnticipoColaboradorStatus.Aplicado;

    /// <summary>Anula el anticipo. Solo posible si está Pendiente y no reservado.</summary>
    public void Void()
    {
        if (Status != AnticipoColaboradorStatus.Pendiente)
            throw new InvalidOperationException("Solo se pueden anular anticipos en estado Pendiente.");
        if (LiquidacionId.HasValue)
            throw new InvalidOperationException("El anticipo está reservado para una liquidación y no puede anularse.");
        Status = AnticipoColaboradorStatus.Anulado;
    }
}
