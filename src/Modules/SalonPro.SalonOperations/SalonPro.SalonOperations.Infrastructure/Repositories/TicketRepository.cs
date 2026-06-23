using SalonPro.SalonOperations.Domain.Entities;
using SalonPro.SalonOperations.Domain.Interfaces;
using SalonPro.SalonOperations.Infrastructure.Data;

namespace SalonPro.SalonOperations.Infrastructure.Repositories;

public class TicketRepository(SalonOpsDbContext db) : ITicketRepository
{
    public async Task AddAsync(Ticket ticket, CancellationToken ct = default)
        => await db.Tickets.AddAsync(ticket, ct);

    public async Task SaveChangesAsync(CancellationToken ct = default)
        => await db.SaveChangesAsync(ct);
}
