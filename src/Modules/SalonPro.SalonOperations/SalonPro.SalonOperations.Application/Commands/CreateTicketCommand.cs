using MediatR;
using SalonPro.SalonOperations.Application.DTOs;
using SalonPro.SalonOperations.Domain.Entities;
using SalonPro.SalonOperations.Domain.Enums;
using SalonPro.SalonOperations.Domain.Interfaces;
using SalonPro.Shared.Common;
using SalonPro.Shared.Exceptions;

namespace SalonPro.SalonOperations.Application.Commands;

public record StylistGroupRequest(
    int StylistId,
    string StylistName,
    decimal CommissionPercent,
    List<SaleServiceItemRequest> Services,
    List<SaleProductItemRequest> ProductsSold,
    List<SaleProductItemRequest> ProductsInternal);

public record CreateTicketRequest(
    string ClientDocumentType,
    string ClientDocumentNumber,
    string ClientFullName,
    string? ClientEmail,
    string? ClientPhone,
    int? BranchId,
    string? BranchName,
    List<SalePaymentRequest> Payments,
    decimal TipAmount,
    string? Notes,
    List<StylistGroupRequest> Groups,
    string? SaleDateTime = null);

public record CreateTicketCommand(int TenantId, int? CashRegisterId, CreateTicketRequest Request) : IRequest<TicketDto>;

public class CreateTicketHandler(
    ITicketRepository ticketRepo,
    ISaleRepository saleRepo,
    IClientRepository clientRepo,
    ISalonServiceRepository serviceRepo,
    ISalonProductRepository productRepo,
    IPaymentMethodRepository paymentMethodRepo,
    ICashRegisterRepository cashRegisterRepo)
    : IRequestHandler<CreateTicketCommand, TicketDto>
{
    public async Task<TicketDto> Handle(CreateTicketCommand cmd, CancellationToken ct)
    {
        var req = cmd.Request;

        // 0. Validar caja abierta
        var branchId = req.BranchId ?? 0;
        var cajaAbierta = await cashRegisterRepo.GetCurrentOpenByTenantAsync(cmd.TenantId, branchId, ct);
        if (cajaAbierta is null)
            throw new BadRequestException("No hay una caja abierta. Ve a Caja → Abrir turno e intenta de nuevo.");

        // 1. Find or create client
        var client = await clientRepo.GetByDocumentAsync(cmd.TenantId, req.ClientDocumentNumber, ct);
        if (client is null)
        {
            client = Client.Create(cmd.TenantId, req.ClientDocumentType, req.ClientDocumentNumber,
                req.ClientFullName, req.ClientEmail, req.ClientPhone);
            await clientRepo.AddAsync(client, ct);
            await clientRepo.SaveChangesAsync(ct);
        }

        // 2. Resolve payment methods
        var paymentDetails = new List<(int MethodId, string MethodName, decimal Amount, decimal DeductionPct)>();
        decimal totalDeductionsTicket = 0;
        foreach (var p in req.Payments)
        {
            var method = await paymentMethodRepo.GetByIdAsync(p.PaymentMethodId, ct)
                ?? throw new NotFoundException("PaymentMethod", p.PaymentMethodId);
            if (method.TenantId != cmd.TenantId) throw new ForbiddenException("Método de pago no pertenece a este tenant.");
            paymentDetails.Add((method.Id, method.Name, p.Amount, method.HasDeduction ? method.DeductionPercent : 0));
            if (method.HasDeduction)
                totalDeductionsTicket += Math.Round(p.Amount * method.DeductionPercent / 100, 2);
        }

        // 3. Parse sale datetime
        DateTime saleDateTime;
        if (!string.IsNullOrWhiteSpace(req.SaleDateTime))
        {
            if (!DateTime.TryParse(req.SaleDateTime,
                    System.Globalization.CultureInfo.InvariantCulture,
                    System.Globalization.DateTimeStyles.RoundtripKind,
                    out var parsed))
                throw new BadRequestException($"Formato de fecha inválido: '{req.SaleDateTime}'.");
            var nowColombia = ColombiaTime.Now;
            saleDateTime = parsed.Kind == DateTimeKind.Utc
                ? TimeZoneInfo.ConvertTimeFromUtc(parsed, TimeZoneInfo.FindSystemTimeZoneById(
                      OperatingSystem.IsWindows() ? "SA Pacific Standard Time" : "America/Bogota"))
                : parsed;
            if (saleDateTime > nowColombia.AddMinutes(5))
                throw new BadRequestException("No se puede registrar una venta con fecha futura.");
        }
        else
        {
            saleDateTime = ColombiaTime.Now;
        }

        // 4. Calcular bruto total del ticket (para ratio de deducción)
        decimal ticketGrossServices = 0, ticketGrossProducts = 0;
        foreach (var g in req.Groups)
        {
            ticketGrossServices += g.Services.Sum(s => s.Price);
            ticketGrossProducts += g.ProductsSold.Sum(p => p.Price);
        }
        decimal ticketGrossNoTip = ticketGrossServices + ticketGrossProducts;
        decimal ticketGrossTotal  = ticketGrossNoTip + req.TipAmount;
        decimal deductionRatio    = ticketGrossTotal > 0 ? totalDeductionsTicket / ticketGrossTotal : 0m;

        // 5. Crear una Sale por cada grupo de estilista
        var sales = new List<Sale>();
        bool isFirst = true;

        foreach (var grp in req.Groups)
        {
            decimal grossServices = 0, grossProducts = 0, internalConsumption = 0;

            var serviceItems  = new List<(SalonService Svc, decimal Price)>();
            var productSoldItems = new List<(SalonProduct Prod, decimal Price)>();
            var productInternalItems = new List<(SalonProduct Prod, decimal Price)>();

            foreach (var si in grp.Services)
            {
                var svc = await serviceRepo.GetByIdAsync(si.ServiceId, ct)
                    ?? throw new NotFoundException("SalonService", si.ServiceId);
                serviceItems.Add((svc, si.Price));
                grossServices += si.Price;
            }
            foreach (var pi in grp.ProductsSold)
            {
                var prod = await productRepo.GetByIdAsync(pi.ProductId, ct)
                    ?? throw new NotFoundException("SalonProduct", pi.ProductId);
                productSoldItems.Add((prod, pi.Price));
                grossProducts += pi.Price;
            }
            foreach (var pi in grp.ProductsInternal)
            {
                var prod = await productRepo.GetByIdAsync(pi.ProductId, ct)
                    ?? throw new NotFoundException("SalonProduct", pi.ProductId);
                productInternalItems.Add((prod, pi.Price));
                internalConsumption += prod.PurchasePrice;
            }

            // Tip: solo al primer estilista (propina general va al primer sale)
            decimal groupTip = isFirst ? req.TipAmount : 0m;
            decimal groupGrossTotal = grossServices + grossProducts + groupTip;

            // Deducciones proporcionales a este grupo
            decimal groupDeductions = groupGrossTotal > 0
                ? Math.Round(totalDeductionsTicket * (groupGrossTotal / ticketGrossTotal), 2)
                : 0m;

            decimal commPct = grp.CommissionPercent / 100m;
            decimal pct     = groupGrossTotal > 0 ? groupDeductions / groupGrossTotal : 0m;

            decimal stylistCommServices = 0, salonCommServices = 0;
            foreach (var (svc, price) in serviceItems)
            {
                var itemBase = price * (1 - pct);
                if (svc.HasSalonFee && svc.SalonFeePercent > 0)
                {
                    var fee       = Math.Round(itemBase * svc.SalonFeePercent / 100, 2);
                    var remainder = itemBase - fee;
                    stylistCommServices += Math.Round(remainder * commPct, 2);
                    salonCommServices   += Math.Round(remainder * (1 - commPct), 2) + fee;
                }
                else
                {
                    stylistCommServices += Math.Round(itemBase * commPct, 2);
                    salonCommServices   += Math.Round(itemBase * (1 - commPct), 2);
                }
            }

            decimal stylistCommProducts = 0, salonCommProducts = 0;
            foreach (var (prod, price) in productSoldItems)
            {
                var itemBase    = price * (1 - pct);
                var prodCommPct = prod.StylistCommissionPercent / 100m;
                stylistCommProducts += Math.Round(itemBase * prodCommPct, 2);
                salonCommProducts   += Math.Round(itemBase * (1 - prodCommPct), 2);
            }

            var netTip = Math.Round(groupTip * (1 - pct), 2);
            decimal stylistTotal = Math.Round(stylistCommServices + stylistCommProducts + netTip, 2);
            decimal salonTotal   = Math.Round(salonCommServices   + salonCommProducts, 2);

            var sale = Sale.Create(
                cmd.TenantId, grp.StylistId, grp.StylistName,
                client.Id, client.FullName, client.DocumentNumber,
                req.ClientDocumentType, req.ClientEmail, req.ClientPhone,
                cajaAbierta.Id, req.BranchId, req.BranchName,
                grp.CommissionPercent,
                grossServices, grossProducts, internalConsumption,
                groupTip, groupDeductions, stylistTotal, salonTotal,
                req.Notes, saleDateTime);

            foreach (var (svc, price) in serviceItems)
                sale.Items.Add(SaleItem.CreateForSale(sale, SaleItemType.Service, svc.Id, svc.Name,
                    price, 1, svc.HasSalonFee ? svc.SalonFeePercent : 0));

            foreach (var (prod, price) in productSoldItems)
            {
                sale.Items.Add(SaleItem.CreateForSale(sale, SaleItemType.ProductSale, prod.Id, prod.Name,
                    price, 1, salonFeePercent: 0, stylistCommissionPercent: prod.StylistCommissionPercent));
                prod.DecrementStock(1);
            }

            foreach (var (prod, _) in productInternalItems)
            {
                sale.Items.Add(SaleItem.CreateForSale(sale, SaleItemType.ProductInternal, prod.Id, prod.Name,
                    prod.PurchasePrice, 1, salonFeePercent: 0, stylistCommissionPercent: 0));
                prod.DecrementStock(1);
            }

            // Pagos: solo al primer sale (proporcional sería más complejo y no cambia liquidaciones)
            if (isFirst)
            {
                foreach (var (methodId, methodName, amount, deductionPct) in paymentDetails)
                    sale.Payments.Add(SalePayment.CreateForSale(sale, methodId, methodName, amount, deductionPct));
            }

            sales.Add(sale);
            isFirst = false;
        }

        // 6. Crear Ticket
        var ticket = Ticket.Create(
            cmd.TenantId, req.BranchId, req.BranchName,
            client.Id, client.FullName,
            saleDateTime, ticketGrossTotal, req.TipAmount, req.Notes);

        // 7. Guardar sales
        foreach (var sale in sales)
            await saleRepo.AddAsync(sale, ct);

        await productRepo.SaveChangesAsync(ct);
        await clientRepo.SaveChangesAsync(ct);
        await saleRepo.SaveChangesAsync(ct);

        // 8. Asignar TicketId a cada sale y guardar ticket
        await ticketRepo.AddAsync(ticket, ct);
        await ticketRepo.SaveChangesAsync(ct);

        foreach (var sale in sales)
            sale.AssignToTicket(ticket.Id);
        await saleRepo.SaveChangesAsync(ct);

        // 9. Actualizar stats cliente
        client.RecordVisit(ticketGrossTotal);
        await clientRepo.SaveChangesAsync(ct);

        return new TicketDto(ticket.Id, ticket.ClientName, ticket.SaleDateTime,
            ticket.GrossTotal, ticket.TipAmount, ticket.Status,
            sales.Select(s => s.Id).ToList());
    }
}
