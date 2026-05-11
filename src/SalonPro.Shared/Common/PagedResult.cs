namespace SalonPro.Shared.Common;

public class PagedResult<T>
{
    public IEnumerable<T> Items { get; init; } = [];
    public int TotalCount { get; init; }
    public int Page { get; init; }
    public int PageSize { get; init; }
    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);

    public static PagedResult<T> Create(IEnumerable<T> items, int totalCount, int page, int pageSize) =>
        new() { Items = items, TotalCount = totalCount, Page = page, PageSize = pageSize };
}

public record PaginationParams(int Page = 1, int PageSize = 20)
{
    public int Skip => (Page - 1) * PageSize;
}
