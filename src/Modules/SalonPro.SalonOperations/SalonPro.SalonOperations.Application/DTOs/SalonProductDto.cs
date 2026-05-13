namespace SalonPro.SalonOperations.Application.DTOs;

public record SalonProductDto(
    int Id,
    string Name,
    string Brand,
    string Category,
    decimal PurchasePrice,
    decimal SalePrice,
    decimal StylistCommissionPercent,
    int Stock,
    bool IsForSale,
    bool IsActive);
