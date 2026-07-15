namespace SalonPro.SalonOperations.Domain.Enums;

public enum SaleStatus
{
    Active,
    Voided,
    Edited,
    /// <summary>Venta incluida en una liquidación cerrada/aprobada.</summary>
    Settled,
    /// <summary>Venta con múltiples colaboradores donde solo algunos han sido liquidados.</summary>
    PartiallySettled,
    /// <summary>Venta registrada sin pago inmediato; excluida de liquidaciones hasta que se pague.</summary>
    PendingPayment
}
