namespace SalonPro.SalonOperations.Application.DTOs;

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
    decimal InternalConsumption);

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
    List<LiquidacionVentaDto> Ventas);
