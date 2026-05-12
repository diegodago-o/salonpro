namespace SalonPro.SalonOperations.Application.DTOs;

public record CashRegisterDetailDto(
    int PaymentMethodId,
    string PaymentMethodName,
    decimal TotalAmount,
    decimal TotalDeductions,
    decimal NetAmount);

public record CashRegisterDto(
    int Id,
    int BranchId,
    string BranchName,
    int CashierId,
    string CashierName,
    string OpenedAt,
    string? ClosedAt,
    decimal OpeningBalance,
    decimal? DeclaredCash,
    decimal? ExpectedCash,
    decimal? Difference,
    string Status,
    string? Notes,
    List<CashRegisterDetailDto> Details);
