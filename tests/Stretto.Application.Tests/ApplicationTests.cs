using Stretto.Application.Exceptions;
using Stretto.Application.Interfaces;

namespace Stretto.Application.Tests;

/// <summary>
/// Tests for Application-layer exceptions.
/// </summary>
public class ApplicationExceptionTests
{
    [Fact]
    public void NotFoundException_inherits_from_Exception()
    {
        var ex = new NotFoundException("Resource not found");
        Assert.IsAssignableFrom<Exception>(ex);
    }

    [Fact]
    public void NotFoundException_preserves_message()
    {
        var ex = new NotFoundException("Member with id 123 not found");
        Assert.Equal("Member with id 123 not found", ex.Message);
    }

    [Fact]
    public void ValidationException_inherits_from_Exception()
    {
        var ex = new Stretto.Application.Exceptions.ValidationException(
            new Dictionary<string, string[]> { ["email"] = ["Email is required"] });
        Assert.IsAssignableFrom<Exception>(ex);
    }

    [Fact]
    public void ValidationException_exposes_errors_dictionary()
    {
        var errors = new Dictionary<string, string[]>
        {
            ["firstName"] = ["First name is required"],
            ["email"] = ["Email is required", "Email must be valid"],
        };
        var ex = new Stretto.Application.Exceptions.ValidationException(errors);

        Assert.Equal(2, ex.Errors.Count);
        Assert.Equal(["First name is required"], ex.Errors["firstName"]);
        Assert.Equal(["Email is required", "Email must be valid"], ex.Errors["email"]);
    }

    [Fact]
    public void ValidationException_has_default_message()
    {
        var ex = new Stretto.Application.Exceptions.ValidationException(
            new Dictionary<string, string[]> { ["name"] = ["Required"] });
        Assert.Equal("One or more validation errors occurred.", ex.Message);
    }
}

/// <summary>
/// Tests that verify IRepository interface contract matches the specification.
/// </summary>
public class RepositoryInterfaceTests
{
    private static readonly Type RepoInterface = typeof(IRepository<>);

    [Fact]
    public void IRepository_is_generic_interface()
    {
        Assert.True(RepoInterface.IsInterface);
        Assert.True(RepoInterface.IsGenericTypeDefinition);
    }

    [Fact]
    public void IRepository_defines_all_required_methods()
    {
        var methods = RepoInterface.GetMethods().Select(m => m.Name).ToHashSet();
        Assert.Contains("GetByIdAsync", methods);
        Assert.Contains("ListAsync", methods);
        Assert.Contains("AddAsync", methods);
        Assert.Contains("UpdateAsync", methods);
        Assert.Contains("DeleteAsync", methods);
    }

    [Fact]
    public void IStorageProvider_defines_all_required_methods()
    {
        var methods = typeof(IStorageProvider)
            .GetMethods().Select(m => m.Name).ToHashSet();
        Assert.Contains("SaveAsync", methods);
        Assert.Contains("GetAsync", methods);
        Assert.Contains("DeleteAsync", methods);
    }

    [Fact]
    public void INotificationProvider_defines_SendAsync()
    {
        var methods = typeof(INotificationProvider)
            .GetMethods().Select(m => m.Name).ToHashSet();
        Assert.Contains("SendAsync", methods);
    }
}
