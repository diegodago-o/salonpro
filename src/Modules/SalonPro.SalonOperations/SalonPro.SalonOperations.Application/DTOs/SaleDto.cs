namespace SalonPro.SalonOperations.Application.DTOs;

public record SaleDto(
    int Id,
    string SaleDateTime,
    string StylistName,
    string ClientName,
    string ClientDocument,
    string PaymentMethodName,
    decimal GrossTotal,
    decimal TotalDeductions,
    decimal StylistTotal,
    decimal SalonTotal,
    decimal TipAmount,
    string Status,
    string? VoidedReason);
