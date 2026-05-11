using SalonPro.Tenants.Domain.Enums;

namespace SalonPro.Tenants.Domain.Entities;

public class Subscription
{
    public int Id { get; private set; }
    public int TenantId { get; private set; }
    public int PlanId { get; private set; }
    public int ExtraBranches { get; private set; }
    public decimal TotalMonthly { get; private set; }
    public BillingCycle BillingCycle { get; private set; }
    public DateTime StartDate { get; private set; }
    public DateTime? NextBillingDate { get; private set; }
    public SubscriptionStatus Status { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    public Tenant Tenant { get; private set; } = null!;
    public Plan Plan { get; private set; } = null!;

    private Subscription() { }

    public static Subscription Create(int tenantId, int planId, decimal planPrice, decimal pricePerExtra,
        int extraBranches, BillingCycle billingCycle)
    {
        var total = planPrice + (pricePerExtra * extraBranches);
        return new Subscription
        {
            TenantId = tenantId,
            PlanId = planId,
            ExtraBranches = extraBranches,
            TotalMonthly = total,
            BillingCycle = billingCycle,
            StartDate = DateTime.UtcNow,
            NextBillingDate = DateTime.UtcNow.AddMonths(billingCycle == BillingCycle.Annual ? 12 : 1),
            Status = SubscriptionStatus.Trial,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
    }

    public void Update(int planId, decimal planPrice, decimal pricePerExtra, int extraBranches, BillingCycle billingCycle)
    {
        PlanId = planId;
        ExtraBranches = extraBranches;
        BillingCycle = billingCycle;
        TotalMonthly = planPrice + (pricePerExtra * extraBranches);
        UpdatedAt = DateTime.UtcNow;
    }

    public void Activate()
    {
        Status = SubscriptionStatus.Active;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Cancel()
    {
        Status = SubscriptionStatus.Cancelled;
        UpdatedAt = DateTime.UtcNow;
    }
}
