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
    decimal Tip,
    decimal InternalConsumption,
    /// <summary>Métodos de pago usados en esta venta (para mostrar en tabla de detalle).</summary>
    string PaymentMethodsSummary);

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
