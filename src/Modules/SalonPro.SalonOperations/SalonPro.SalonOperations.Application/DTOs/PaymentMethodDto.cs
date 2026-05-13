namespace SalonPro.SalonOperations.Application.DTOs;

public record PaymentMethodDto(
    int Id,
    string Name,
    bool HasDeduction,
    decimal DeductionPercent,
    bool IsActive = true);
