namespace SalonPro.SalonOperations.Application.DTOs;

/// <summary>Desglose de una deducción por método de pago dentro de una liquidación.</summary>
public record DeduccionDetalleDto(
    string PaymentMethodName,
    decimal DeductionPercent,
    decimal TotalAmount);

public record LiquidacionVentaDto(
    int SaleId,
    string SaleDateTime,
    string ClientName,
    decimal GrossServices,
    decimal GrossProducts,
    decimal Deduction,
    decimal CommServices,
    decimal CommProducts,
    /// <summary>Propina neta (ya descontada la deducción proporcional del método de pago).</summary>
    decimal Tip,
    decimal InternalConsumption,
    /// <summary>Métodos de pago usados en esta venta (para mostrar en tabla de detalle).</summary>
    string PaymentMethodsSummary,
    /// <summary>Productos consumidos internamente: ["Tintura rubio — $20.000", …]</summary>
    List<string> InternalItems,
    /// <summary>Detalle de comisión por servicio: ["Corte — $88.350", …]</summary>
    List<string> ServiceCommItems,
    /// <summary>Detalle de comisión por producto vendido: ["Tintura rubio — $12.126", …]</summary>
    List<string> ProductCommItems);

public record LiquidacionResumenDto(
    int Id,
    int StylistId,
    string StylistName,
    string StartDate,
    string EndDate,
    int TotalVentas,
    decimal GrossServices,
    decimal GrossProducts,
    decimal TotalDeductions,
    decimal CommServices,
    decimal CommProducts,
    decimal TotalTips,
    decimal InternalConsumption,
    decimal AnticiposAplicados,
    decimal NetoPeluquero,
    string Status);

public record LiquidacionDetalleDto(
    int Id,
    int StylistId,
    string StylistName,
    string StartDate,
    string EndDate,
    int TotalVentas,
    decimal GrossServices,
    decimal GrossProducts,
    decimal TotalDeductions,
    decimal CommServices,
    decimal CommProducts,
    decimal TotalTips,
    decimal InternalConsumption,
    decimal AnticiposAplicados,
    decimal NetoPeluquero,
    string Status,
    List<LiquidacionVentaDto> Ventas,
    /// <summary>Desglose de deducciones agrupado por método de pago.</summary>
    List<DeduccionDetalleDto> DeduccionesDetalle);
