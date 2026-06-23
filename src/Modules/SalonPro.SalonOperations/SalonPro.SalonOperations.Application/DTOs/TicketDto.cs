namespace SalonPro.SalonOperations.Application.DTOs;

public record TicketDto(
    int Id,
    string ClientName,
    DateTime SaleDateTime,
    decimal GrossTotal,
    decimal TipAmount,
    string Status,
    List<int> SaleIds);
