using System.Linq.Expressions;

namespace Stretto.Application.Interfaces;

public interface IRepository<T>
{
    Task<T?> GetByIdAsync(Guid id, Guid orgId);
    /// <summary>
    /// Returns the first entity matching <paramref name="predicate"/> WITHOUT org-scoping.
    /// Only use for cross-tenant lookups (e.g. auth). Never for business data queries.
    /// </summary>
    Task<T?> FindOneAsync(Expression<Func<T, bool>> predicate);
    Task<List<T>> ListAsync(Guid orgId, Expression<Func<T, bool>>? predicate = null);
    Task AddAsync(T entity);
    Task UpdateAsync(T entity);
    Task DeleteAsync(T entity);
}
