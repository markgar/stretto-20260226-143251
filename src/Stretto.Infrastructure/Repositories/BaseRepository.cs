using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using Stretto.Application.Interfaces;
using Stretto.Infrastructure.Data;

namespace Stretto.Infrastructure.Repositories;

public class BaseRepository<T> : IRepository<T> where T : class
{
    private readonly AppDbContext _context;

    public BaseRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<T?> GetByIdAsync(Guid id, Guid orgId)
    {
        return await _context.Set<T>()
            .Where(e => EF.Property<Guid>(e, "Id") == id
                     && EF.Property<Guid>(e, "OrganizationId") == orgId)
            .FirstOrDefaultAsync();
    }

    public async Task<T?> FindOneAsync(Expression<Func<T, bool>> predicate)
    {
        return await _context.Set<T>().Where(predicate).FirstOrDefaultAsync();
    }

    public async Task<List<T>> ListAsync(Guid orgId, Expression<Func<T, bool>>? predicate = null)
    {
        IQueryable<T> query = _context.Set<T>()
            .Where(e => EF.Property<Guid>(e, "OrganizationId") == orgId);

        if (predicate is not null)
            query = query.Where(predicate);

        return await query.ToListAsync();
    }

    public async Task AddAsync(T entity)
    {
        await _context.Set<T>().AddAsync(entity);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateAsync(T entity)
    {
        _context.Set<T>().Update(entity);
        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new Stretto.Application.Exceptions.ConcurrencyException("The record was modified by another request. Please retry.");
        }
    }

    public async Task DeleteAsync(T entity)
    {
        _context.Set<T>().Remove(entity);
        await _context.SaveChangesAsync();
    }
}
