namespace SalonPro.Shared.Exceptions;

public class NotFoundException(string entity, object id)
    : Exception($"{entity} con id '{id}' no encontrado.");
