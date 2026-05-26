namespace SalonPro.Shared.Common;

/// <summary>
/// Utilidad centralizada para obtener la hora actual en Colombia (UTC-5).
/// Colombia no cambia de horario (sin DST), siempre es UTC-5.
/// Usar en toda la lógica de negocio en lugar de DateTime.UtcNow.
/// </summary>
public static class ColombiaTime
{
    private static readonly TimeZoneInfo Zone =
        TimeZoneInfo.FindSystemTimeZoneById(
            OperatingSystem.IsWindows()
                ? "SA Pacific Standard Time"   // Windows
                : "America/Bogota");           // Linux/macOS

    /// <summary>Fecha y hora actual en Colombia.</summary>
    public static DateTime Now => TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, Zone);

    /// <summary>Fecha actual en Colombia (sin hora).</summary>
    public static DateTime Today => Now.Date;

    /// <summary>
    /// Parsea un string "YYYY-MM-DD" como inicio de día en Colombia
    /// (2026-05-26 → 2026-05-26 00:00:00).
    /// </summary>
    public static DateTime StartOfDay(string dateStr) =>
        DateTime.Parse(dateStr).Date;

    /// <summary>
    /// Parsea un string "YYYY-MM-DD" como fin de día en Colombia
    /// (2026-05-26 → 2026-05-26 23:59:59).
    /// </summary>
    public static DateTime EndOfDay(string dateStr) =>
        DateTime.Parse(dateStr).Date.AddDays(1).AddSeconds(-1);
}
