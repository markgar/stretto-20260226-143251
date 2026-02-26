using Microsoft.Extensions.Configuration;
using Stretto.Application.Exceptions;
using Stretto.Application.Interfaces;

namespace Stretto.Infrastructure;

public class LocalFileStorageProvider : IStorageProvider
{
    private readonly string _uploadRoot;

    public LocalFileStorageProvider(IConfiguration configuration)
    {
        _uploadRoot = configuration["Storage:UploadPath"] ?? "uploads";
    }

    public async Task<string> SaveAsync(string fileName, Stream content)
    {
        Directory.CreateDirectory(_uploadRoot);
        var safeFileName = Path.GetFileName(fileName);
        if (string.IsNullOrWhiteSpace(safeFileName))
            safeFileName = "upload";
        var storedName = $"{Guid.NewGuid()}_{safeFileName}";
        var fullPath = Path.Combine(_uploadRoot, storedName);
        await using var fileStream = File.Create(fullPath);
        await content.CopyToAsync(fileStream);
        return fullPath;
    }

    public Task<Stream> GetAsync(string storagePath)
    {
        try
        {
            Stream stream = File.OpenRead(storagePath);
            return Task.FromResult(stream);
        }
        catch (Exception)
        {
            throw new NotFoundException("Document file not found");
        }
    }

    public Task DeleteAsync(string storagePath)
    {
        if (File.Exists(storagePath))
            File.Delete(storagePath);
        return Task.CompletedTask;
    }
}
