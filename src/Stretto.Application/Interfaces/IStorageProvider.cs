namespace Stretto.Application.Interfaces;

public interface IStorageProvider
{
    Task<string> SaveAsync(string fileName, Stream content);
    Task<Stream> GetAsync(string storagePath);
    Task DeleteAsync(string storagePath);
}
