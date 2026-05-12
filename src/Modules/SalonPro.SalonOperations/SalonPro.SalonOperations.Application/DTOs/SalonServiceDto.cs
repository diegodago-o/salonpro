namespace SalonPro.SalonOperations.Application.DTOs;

public record SalonServiceDto(
    int Id,
    string Name,
    string Category,
    decimal Price,
    bool HasSalonFee,
    decimal SalonFeePercent,
    bool IsActive);
