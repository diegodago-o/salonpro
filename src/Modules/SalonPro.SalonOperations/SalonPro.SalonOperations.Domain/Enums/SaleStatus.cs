namespace SalonPro.SalonOperations.Domain.Enums;

public enum SaleStatus
{
    Active,
    Voided,
    Edited,
    /// <summary>Venta incluida en una liquidación cerrada/aprobada.</summary>
    Settled,
    /// <summary>Venta con múltiples colaboradores donde solo algunos han sido liquidados.</summary>
    PartiallySettled
}
