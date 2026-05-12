namespace SalonPro.Shared.Exceptions;

public class ForbiddenException(string message = "Acceso denegado.") : Exception(message);
