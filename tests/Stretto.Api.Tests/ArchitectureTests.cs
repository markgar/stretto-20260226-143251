using System.Reflection;
using System.Xml.Linq;

namespace Stretto.Api.Tests;

/// <summary>
/// Verifies the clean architecture layer dependency rules by reading project files.
/// Domain has no project references.
/// Application references Domain only.
/// Infrastructure references Application (not Api).
/// Api references Application and Infrastructure (not Domain directly).
/// </summary>
public class ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(
            Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location)!,
            "../../../../../"));

    private static IEnumerable<string> GetProjectReferences(string projectRelativePath)
    {
        var csprojPath = Path.Combine(RepoRoot, projectRelativePath);
        var doc = XDocument.Load(csprojPath);
        return doc.Descendants("ProjectReference")
            .Select(e => (e.Attribute("Include")?.Value ?? "").Replace('\\', '/'))
            .Select(path => Path.GetFileNameWithoutExtension(path))
            .Where(name => name.StartsWith("Stretto."));
    }

    [Fact]
    public void Domain_has_no_project_references()
    {
        var refs = GetProjectReferences("src/Stretto.Domain/Stretto.Domain.csproj");
        Assert.Empty(refs);
    }

    [Fact]
    public void Application_references_Domain_only()
    {
        var refs = GetProjectReferences("src/Stretto.Application/Stretto.Application.csproj").ToList();
        Assert.Contains("Stretto.Domain", refs);
        Assert.DoesNotContain("Stretto.Infrastructure", refs);
        Assert.DoesNotContain("Stretto.Api", refs);
    }

    [Fact]
    public void Infrastructure_references_Application_and_not_Api()
    {
        var refs = GetProjectReferences("src/Stretto.Infrastructure/Stretto.Infrastructure.csproj").ToList();
        Assert.Contains("Stretto.Application", refs);
        Assert.DoesNotContain("Stretto.Api", refs);
    }

    [Fact]
    public void Api_references_Application_and_Infrastructure()
    {
        var refs = GetProjectReferences("src/Stretto.Api/Stretto.Api.csproj").ToList();
        Assert.Contains("Stretto.Application", refs);
        Assert.Contains("Stretto.Infrastructure", refs);
    }

    [Fact]
    public void Api_does_not_reference_Domain_directly()
    {
        // Api should depend on Domain only transitively (via Application).
        var refs = GetProjectReferences("src/Stretto.Api/Stretto.Api.csproj").ToList();
        Assert.DoesNotContain("Stretto.Domain", refs);
    }

    [Fact]
    public void All_four_Stretto_assemblies_load_successfully()
    {
        Assert.NotNull(Assembly.Load("Stretto.Domain"));
        Assert.NotNull(Assembly.Load("Stretto.Application"));
        Assert.NotNull(Assembly.Load("Stretto.Infrastructure"));
        Assert.NotNull(Assembly.Load("Stretto.Api"));
    }
}
