namespace SalonPro.SalonOperations.Domain.Entities;

public class Client
{
    public int Id { get; private set; }
    public int TenantId { get; private set; }
    public string DocumentType { get; private set; } = string.Empty;
    public string DocumentNumber { get; private set; } = string.Empty;
    public string FullName { get; private set; } = string.Empty;
    public string? Email { get; private set; }
    public string Phone { get; private set; } = string.Empty;
    public int TotalVisits { get; private set; }
    public decimal TotalSpent { get; private set; }
    public DateTime? LastVisit { get; private set; }
    public DateTime CreatedAt { get; private set; }

    private Client() { }

    public static Client Create(int tenantId, string documentType, string documentNumber,
        string fullName, string? email, string phone)
    {
        return new Client
        {
            TenantId = tenantId,
            DocumentType = documentType.Trim(),
            DocumentNumber = documentNumber.Trim(),
            FullName = fullName.Trim(),
            Email = email?.Trim(),
            Phone = phone.Trim(),
            TotalVisits = 0,
            TotalSpent = 0,
            CreatedAt = DateTime.UtcNow
        };
    }

    public void Update(string documentType, string documentNumber, string fullName, string? email, string phone)
    {
        DocumentType = documentType.Trim();
        DocumentNumber = documentNumber.Trim();
        FullName = fullName.Trim();
        Email = email?.Trim();
        Phone = phone.Trim();
    }

    public void RecordVisit(decimal amount)
    {
        TotalVisits++;
        TotalSpent += amount;
        LastVisit = DateTime.UtcNow;
    }
}
