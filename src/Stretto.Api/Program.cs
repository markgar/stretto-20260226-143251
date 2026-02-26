using Microsoft.EntityFrameworkCore;
using Stretto.Application.Interfaces;
using Stretto.Application.Services;
using Stretto.Infrastructure.Auth;
using Stretto.Infrastructure.Data;
using Stretto.Infrastructure.Repositories;
using Stretto.Api.Middleware;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddControllers();

builder.Services.AddDbContext<AppDbContext>(o => o.UseInMemoryDatabase("StrettoDB"));
builder.Services.AddScoped(typeof(IRepository<>), typeof(BaseRepository<>));
builder.Services.AddSingleton<IAuthSessionStore, InMemoryAuthSessionStore>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IVenueService, VenueService>();
builder.Services.AddScoped<IMemberService, MemberService>();
builder.Services.AddScoped<ProgramYearService>();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await DataSeeder.SeedAsync(db);
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseMiddleware<GlobalExceptionHandlerMiddleware>();

app.MapGet("/health", () => Results.Ok(new { status = "healthy" }))
   .WithName("GetHealth")
   .WithTags("Health");

app.MapControllers();

app.Run();

public partial class Program {}
