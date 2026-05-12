namespace SalonPro.SalonOperations.Application.DTOs;

public record AnticipoDto(
    int Id,
    string ClientName,
    string ClientDocument,
    string ClientPhone,
    decimal Amount,
    string PaymentMethodName,
    string? Notes,
    string CreatedAt,
    string Status);
