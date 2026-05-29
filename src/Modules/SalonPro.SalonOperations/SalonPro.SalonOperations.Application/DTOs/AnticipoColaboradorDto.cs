namespace SalonPro.SalonOperations.Application.DTOs;

public record AnticipoColaboradorDto(
    int     Id,
    int     StylistId,
    string  StylistName,
    decimal Amount,
    /// <summary>Fecha del anticipo en formato yyyy-MM-dd.</summary>
    string  Date,
    string? Notes,
    string  Status,
    int?    LiquidacionId,
    string  CreatedAt);
