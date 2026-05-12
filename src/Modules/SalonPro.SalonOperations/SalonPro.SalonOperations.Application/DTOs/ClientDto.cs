namespace SalonPro.SalonOperations.Application.DTOs;

public record ClientDto(
    int Id,
    string DocumentType,
    string DocumentNumber,
    string FullName,
    string? Email,
    string Phone,
    int TotalVisits,
    decimal TotalSpent,
    DateTime? LastVisit,
    DateTime CreatedAt);
