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
    ISaleRepository saleRepo,
    IClientRepository clientRepo,
    ISalonServiceRepository serviceRepo,
    ISalonProductRepository productRepo,
    IPaymentMethodRepository paymentMethodRepo,
    ICashRegisterRepository cashRegisterRepo)
    : IRequestHandler<CreateTicketCommand, TicketDto>
{
    private record GroupResolved(
        StylistGroupRequest Grp,
        List<(SalonService Svc, decimal Price)> Services,
        List<(SalonProduct Prod, decimal Price)> ProductsSold,
        List<(SalonProduct Prod, decimal Price)> ProductsInternal,
        decimal GrossServices,
        decimal GrossProducts);

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

        // 4. Resolver datos de todos los grupos (sin mutaciones aún)
        var groupsResolved = new List<GroupResolved>();
        decimal ticketGrossNoTip = 0;

        foreach (var grp in req.Groups)
        {
            decimal grossServices = 0, grossProducts = 0;
            var svcItems  = new List<(SalonService Svc, decimal Price)>();
            var prodSold  = new List<(SalonProduct Prod, decimal Price)>();
            var prodIntl  = new List<(SalonProduct Prod, decimal Price)>();

            foreach (var si in grp.Services)
            {
                var svc = await serviceRepo.GetByIdAsync(si.ServiceId, ct)
                    ?? throw new NotFoundException("SalonService", si.ServiceId);
                svcItems.Add((svc, si.Price));
                grossServices += si.Price;
            }
            foreach (var pi in grp.ProductsSold)
            {
                var prod = await productRepo.GetByIdAsync(pi.ProductId, ct)
                    ?? throw new NotFoundException("SalonProduct", pi.ProductId);
                prodSold.Add((prod, pi.Price));
                grossProducts += pi.Price;
            }
            foreach (var pi in grp.ProductsInternal)
            {
                var prod = await productRepo.GetByIdAsync(pi.ProductId, ct)
                    ?? throw new NotFoundException("SalonProduct", pi.ProductId);
                prodIntl.Add((prod, pi.Price));
            }

            ticketGrossNoTip += grossServices + grossProducts;
            groupsResolved.Add(new GroupResolved(grp, svcItems, prodSold, prodIntl, grossServices, grossProducts));
        }

        decimal ticketGrossTotal = ticketGrossNoTip + req.TipAmount;

        // 5. Crear las Sales por cada grupo de estilista
        // No persistimos Ticket en BD: la tabla Tickets aún no está disponible en producción.
        // El "ticket" es un concepto virtual identificado por el Id de la primera Sale.
        var sales = new List<Sale>();
        bool isFirst = true;

        foreach (var gd in groupsResolved)
        {
            var grp = gd.Grp;
            decimal groupTip      = isFirst ? req.TipAmount : 0m;
            decimal groupGrossTotal = gd.GrossServices + gd.GrossProducts + groupTip;

            decimal groupDeductions = ticketGrossTotal > 0
                ? Math.Round(totalDeductionsTicket * groupGrossTotal / ticketGrossTotal, 2)
                : 0m;

            decimal pct    = groupGrossTotal > 0 ? groupDeductions / groupGrossTotal : 0m;
            decimal commPct = grp.CommissionPercent / 100m;

            decimal stylistCommServices = 0, salonCommServices = 0;
            foreach (var (svc, price) in gd.Services)
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
            foreach (var (prod, price) in gd.ProductsSold)
            {
                var itemBase    = price * (1 - pct);
                var prodCommPct = prod.StylistCommissionPercent / 100m;
                stylistCommProducts += Math.Round(itemBase * prodCommPct, 2);
                salonCommProducts   += Math.Round(itemBase * (1 - prodCommPct), 2);
            }

            var netTip             = Math.Round(groupTip * (1 - pct), 2);
            decimal internalConsumption = gd.ProductsInternal.Sum(pi => pi.Prod.PurchasePrice);
            decimal stylistTotal   = Math.Round(stylistCommServices + stylistCommProducts + netTip, 2);
            decimal salonTotal     = Math.Round(salonCommServices   + salonCommProducts, 2);

            var sale = Sale.Create(
                cmd.TenantId, grp.StylistId, grp.StylistName,
                client.Id, client.FullName, client.DocumentNumber,
                req.ClientDocumentType, req.ClientEmail, req.ClientPhone,
                cajaAbierta.Id, req.BranchId, req.BranchName,
                grp.CommissionPercent,
                gd.GrossServices, gd.GrossProducts, internalConsumption,
                groupTip, groupDeductions, stylistTotal, salonTotal,
                req.Notes, saleDateTime);

            foreach (var (svc, price) in gd.Services)
                sale.Items.Add(SaleItem.CreateForSale(sale, SaleItemType.Service, svc.Id, svc.Name,
                    price, 1, svc.HasSalonFee ? svc.SalonFeePercent : 0));

            foreach (var (prod, price) in gd.ProductsSold)
            {
                sale.Items.Add(SaleItem.CreateForSale(sale, SaleItemType.ProductSale, prod.Id, prod.Name,
                    price, 1, salonFeePercent: 0, stylistCommissionPercent: prod.StylistCommissionPercent));
                prod.DecrementStock(1);
            }

            foreach (var (prod, _) in gd.ProductsInternal)
            {
                sale.Items.Add(SaleItem.CreateForSale(sale, SaleItemType.ProductInternal, prod.Id, prod.Name,
                    prod.PurchasePrice, 1, salonFeePercent: 0, stylistCommissionPercent: 0));
                prod.DecrementStock(1);
            }

            if (isFirst)
            {
                foreach (var (methodId, methodName, amount, deductionPct) in paymentDetails)
                    sale.Payments.Add(SalePayment.CreateForSale(sale, methodId, methodName, amount, deductionPct));
            }

            await saleRepo.AddAsync(sale, ct);
            sales.Add(sale);
            isFirst = false;
        }

        // 6. Guardar Sales, stock y stats del cliente
        client.RecordVisit(ticketGrossTotal);
        await saleRepo.SaveChangesAsync(ct);

        // El Id de la primera Sale actúa como identificador del grupo de ventas
        int virtualTicketId = sales.First().Id;
        await saleRepo.LinkToTicketAsync(sales.Select(s => s.Id), virtualTicketId, ct);

        return new TicketDto(virtualTicketId, client.FullName, saleDateTime,
            ticketGrossTotal, req.TipAmount, "Active",
            sales.Select(s => s.Id).ToList());
    }
}
