using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Primitives;
using Stretto.Application.Exceptions;

namespace Stretto.Infrastructure.Tests;

/// <summary>
/// Minimal IConfiguration stub that returns values from a fixed dictionary.
/// </summary>
file class DictConfiguration : IConfiguration
{
    private readonly Dictionary<string, string?> _data;
    public DictConfiguration(Dictionary<string, string?> data) => _data = data;
    public string? this[string key] { get => _data.TryGetValue(key, out var v) ? v : null; set => _data[key] = value; }
    public IConfigurationSection GetSection(string key) => throw new NotSupportedException();
    public IEnumerable<IConfigurationSection> GetChildren() => throw new NotSupportedException();
    public IChangeToken GetReloadToken() => throw new NotSupportedException();
}

/// <summary>
/// Unit tests for LocalFileStorageProvider — verifies save, retrieve, and delete
/// operations using a temporary directory that is cleaned up after each test.
/// </summary>
public class LocalFileStorageProviderTests : IDisposable
{
    private readonly string _tempDir;
    private readonly LocalFileStorageProvider _provider;

    public LocalFileStorageProviderTests()
    {
        _tempDir = Path.Combine(Path.GetTempPath(), "stretto-storage-tests-" + Guid.NewGuid());
        var config = new DictConfiguration(new Dictionary<string, string?> { ["Storage:UploadPath"] = _tempDir });
        _provider = new LocalFileStorageProvider(config);
    }

    public void Dispose()
    {
        if (Directory.Exists(_tempDir))
            Directory.Delete(_tempDir, recursive: true);
    }

    [Fact]
    public async Task SaveAsync_creates_file_in_upload_directory_and_returns_path()
    {
        using var content = new MemoryStream("test content"u8.ToArray());

        var path = await _provider.SaveAsync("test.txt", content);

        Assert.True(File.Exists(path), $"Expected file at '{path}' to exist");
        Assert.StartsWith(_tempDir, path);
        Assert.Contains("test.txt", path);
    }

    [Fact]
    public async Task SaveAsync_persists_exact_file_content()
    {
        var bytes = "hello storage"u8.ToArray();
        using var content = new MemoryStream(bytes);

        var path = await _provider.SaveAsync("hello.bin", content);

        var stored = await File.ReadAllBytesAsync(path);
        Assert.Equal(bytes, stored);
    }

    [Fact]
    public async Task GetAsync_returns_readable_stream_with_correct_content()
    {
        var bytes = "stream content"u8.ToArray();
        using var upload = new MemoryStream(bytes);
        var path = await _provider.SaveAsync("readable.txt", upload);

        var stream = await _provider.GetAsync(path);

        using var ms = new MemoryStream();
        await stream.CopyToAsync(ms);
        Assert.Equal(bytes, ms.ToArray());
    }

    [Fact]
    public async Task GetAsync_throws_NotFoundException_when_file_does_not_exist()
    {
        var missingPath = Path.Combine(_tempDir, "nonexistent.pdf");

        await Assert.ThrowsAsync<NotFoundException>(() => _provider.GetAsync(missingPath));
    }

    [Fact]
    public async Task DeleteAsync_removes_an_existing_file()
    {
        using var content = new MemoryStream("deletable"u8.ToArray());
        var path = await _provider.SaveAsync("todelete.txt", content);
        Assert.True(File.Exists(path));

        await _provider.DeleteAsync(path);

        Assert.False(File.Exists(path));
    }

    [Fact]
    public async Task DeleteAsync_does_not_throw_when_file_does_not_exist()
    {
        var missingPath = Path.Combine(_tempDir, "ghost.pdf");

        var exception = await Record.ExceptionAsync(() => _provider.DeleteAsync(missingPath));

        Assert.Null(exception);
    }
}
