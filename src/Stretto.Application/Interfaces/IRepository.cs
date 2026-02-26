using System.Linq.Expressions;

namespace Stretto.Application.Interfaces;

public interface IRepository<T>
{
    Task<T?> GetByIdAsync(Guid id, Guid orgId);
    Task<List<T>> ListAsync(Guid orgId, Expression<Func<T, bool>>? predicate = null);
    Task AddAsync(T entity);
    Task UpdateAsync(T entity);
    Task DeleteAsync(T entity);
}
