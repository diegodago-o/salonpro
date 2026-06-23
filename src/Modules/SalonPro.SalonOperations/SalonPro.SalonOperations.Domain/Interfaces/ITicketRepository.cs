using SalonPro.SalonOperations.Domain.Entities;

namespace SalonPro.SalonOperations.Domain.Interfaces;

public interface ITicketRepository
{
    Task AddAsync(Ticket ticket, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}
