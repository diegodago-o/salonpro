namespace SalonPro.SalonOperations.Application.DTOs;

public record SaleItemDto(
    int Id,
    string Type,        // Service | ProductSale | ProductInternal
    string Name,
    decimal UnitPrice,
    int Quantity,
    decimal Subtotal,
    decimal SalonFeePercent
);

public record SalePaymentDto(
    int PaymentMethodId,
    string PaymentMethodName,
    decimal Amount,
    decimal DeductionPercent,
    decimal DeductionAmount
);

public record SaleDto(
    int Id,
    string SaleDateTime,
    // Stylist
    int StylistId,
    string StylistName,
    decimal CommissionPercent,
    // Client
    string ClientName,
    string ClientDocument,
    string? ClientDocumentType,
    string? ClientEmail,
    string? ClientPhone,
    // Location
    string? BranchName,
    // Payment
    string PaymentMethodName,          // primary (backward-compat)
    // Financial breakdown
    decimal GrossServices,
    decimal GrossProducts,
    decimal InternalConsumption,
    decimal TipAmount,
    decimal TotalDeductions,
    decimal GrossTotal,
    decimal StylistTotal,
    decimal SalonTotal,
    // Status
    string Status,
    string? VoidedReason,
    string? Notes,
    // Detail (null on list, populated on GetById)
    IEnumerable<SaleItemDto>? Items,
    IEnumerable<SalePaymentDto>? Payments
);
