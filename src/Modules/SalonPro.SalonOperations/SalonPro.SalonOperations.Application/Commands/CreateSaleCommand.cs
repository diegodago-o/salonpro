using MediatR;
using SalonPro.SalonOperations.Application.DTOs;
using SalonPro.SalonOperations.Domain.Entities;
using SalonPro.SalonOperations.Domain.Enums;
using SalonPro.SalonOperations.Domain.Interfaces;
using SalonPro.Shared.Exceptions;

namespace SalonPro.SalonOperations.Application.Commands;

public record SalePaymentRequest(int PaymentMethodId, decimal Amount);
public record SaleServiceItemRequest(int ServiceId, decimal Price);
public record SaleProductItemRequest(int ProductId, decimal Price);

public record CreateSaleRequest(
    int StylistId,
    string StylistName,
    string ClientDocumentType,
    string ClientDocumentNumber,
    string ClientFullName,
    string? ClientEmail,
    string ClientPhone,
    List<SalePaymentRequest> Payments,
    decimal TipAmount,
    string? Notes,
    List<SaleServiceItemRequest> Services,
    List<SaleProductItemRequest> ProductsSold,
    List<SaleProductItemRequest> ProductsInternal);

public record CreateSaleCommand(int TenantId, int? CashRegisterId, CreateSaleRequest Request) : IRequest<SaleDto>;

public class CreateSaleHandler(
    ISaleRepository saleRepo,
    IClientRepository clientRepo,
    ISalonServiceRepository serviceRepo,
    ISalonProductRepository productRepo,
    IPaymentMethodRepository paymentMethodRepo)
    : IRequestHandler<CreateSaleCommand, SaleDto>
{
    public async Task<SaleDto> Handle(CreateSaleCommand cmd, CancellationToken ct)
    {
        var req = cmd.Request;

        // 1. Find or create client (upsert by tenant + document number)
        var client = await clientRepo.GetByDocumentAsync(cmd.TenantId, req.ClientDocumentNumber, ct);
        if (client is null)
        {
            client = Client.Create(cmd.TenantId, req.ClientDocumentType, req.ClientDocumentNumber,
                req.ClientFullName, req.ClientEmail, req.ClientPhone);
            await clientRepo.AddAsync(client, ct);
            await clientRepo.SaveChangesAsync(ct);
        }

        // 2. Resolve payment methods and compute deductions
        decimal grossServices = 0;
        decimal grossProducts = 0;
        decimal internalConsumption = 0;
        decimal totalDeductions = 0;

        var paymentDetails = new List<(int MethodId, string MethodName, decimal Amount, decimal DeductionPct)>();
        foreach (var p in req.Payments)
        {
            var method = await paymentMethodRepo.GetByIdAsync(p.PaymentMethodId, ct)
                ?? throw new NotFoundException("PaymentMethod", p.PaymentMethodId);
            paymentDetails.Add((method.Id, method.Name, p.Amount, method.HasDeduction ? method.DeductionPercent : 0));
            if (method.HasDeduction)
                totalDeductions += Math.Round(p.Amount * method.DeductionPercent / 100, 2);
        }

        // 3. Resolve services
        var serviceItems = new List<(SalonService Svc, decimal Price)>();
        foreach (var si in req.Services)
        {
            var svc = await serviceRepo.GetByIdAsync(si.ServiceId, ct)
                ?? throw new NotFoundException("SalonService", si.ServiceId);
            serviceItems.Add((svc, si.Price));
            grossServices += si.Price;
        }

        // 4. Resolve products sold
        var productSoldItems = new List<(SalonProduct Prod, decimal Price)>();
        foreach (var pi in req.ProductsSold)
        {
            var prod = await productRepo.GetByIdAsync(pi.ProductId, ct)
                ?? throw new NotFoundException("SalonProduct", pi.ProductId);
            productSoldItems.Add((prod, pi.Price));
            grossProducts += pi.Price;
        }

        // 5. Resolve internal consumption products
        var productInternalItems = new List<(SalonProduct Prod, decimal Price)>();
        foreach (var pi in req.ProductsInternal)
        {
            var prod = await productRepo.GetByIdAsync(pi.ProductId, ct)
                ?? throw new NotFoundException("SalonProduct", pi.ProductId);
            productInternalItems.Add((prod, pi.Price));
            internalConsumption += prod.PurchasePrice;
        }

        // 6. For MVP: accept totals from frontend calculation
        // StylistTotal and SalonTotal will be 0 until server-side calc is implemented
        decimal stylistTotal = 0;
        decimal salonTotal = 0;

        // 7. Create sale
        var sale = Sale.Create(
            cmd.TenantId,
            req.StylistId,
            req.StylistName,
            client.Id,
            client.FullName,
            client.DocumentNumber,
            cmd.CashRegisterId,
            grossServices,
            grossProducts,
            internalConsumption,
            req.TipAmount,
            totalDeductions,
            stylistTotal,
            salonTotal,
            req.Notes);

        // 8. Add sale items
        foreach (var (svc, price) in serviceItems)
            sale.Items.Add(SaleItem.CreateForSale(sale, SaleItemType.Service, svc.Id, svc.Name,
                price, 1, svc.HasSalonFee ? svc.SalonFeePercent : 0));

        foreach (var (prod, price) in productSoldItems)
        {
            sale.Items.Add(SaleItem.CreateForSale(sale, SaleItemType.ProductSale, prod.Id, prod.Name,
                price, 1, 0));
            prod.DecrementStock(1);
        }

        foreach (var (prod, price) in productInternalItems)
        {
            sale.Items.Add(SaleItem.CreateForSale(sale, SaleItemType.ProductInternal, prod.Id, prod.Name,
                prod.PurchasePrice, 1, 0));
            prod.DecrementStock(1);
        }

        // 9. Add payments
        foreach (var (methodId, methodName, amount, deductionPct) in paymentDetails)
            sale.Payments.Add(SalePayment.CreateForSale(sale, methodId, methodName, amount, deductionPct));

        await saleRepo.AddAsync(sale, ct);

        // 10. Update client stats
        client.RecordVisit(sale.GrossTotal);

        // 11. Save products (stock decrements)
        await productRepo.SaveChangesAsync(ct);
        await clientRepo.SaveChangesAsync(ct);
        await saleRepo.SaveChangesAsync(ct);

        var primaryPayment = paymentDetails.FirstOrDefault();
        return new SaleDto(
            sale.Id, sale.SaleDateTime.ToString("o"),
            sale.StylistName, sale.ClientName, sale.ClientDocument,
            primaryPayment.MethodName ?? string.Empty,
            sale.GrossTotal, sale.TotalDeductions,
            sale.StylistTotal, sale.SalonTotal, sale.TipAmount,
            sale.Status.ToString(), sale.VoidedReason);
    }
}
