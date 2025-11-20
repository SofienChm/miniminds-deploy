using DaycareAPI.Data;
using DaycareAPI.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Threading.Tasks;

var builder = WebApplication.CreateBuilder(args);

// TEMPORARILY DISABLE DATABASE - GET API WORKING FIRST
Console.WriteLine("Database temporarily disabled - API will work without auth for now");
string connectionString = null;

// Add JWT Authentication (with fallback)
var jwtKey = builder.Configuration["JWT_SECRET_KEY"] ?? builder.Configuration["Jwt:Key"] ?? "fallback-secret-key-for-development-only";
var jwtIssuer = builder.Configuration["JWT_ISSUER"] ?? builder.Configuration["Jwt:Issuer"] ?? "miniminds-api";
var jwtAudience = builder.Configuration["JWT_AUDIENCE"] ?? builder.Configuration["Jwt:Audience"] ?? "miniminds-web";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey!))
    };
    
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/notificationHub"))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularApp",
        policy =>
        {
            policy.WithOrigins(
                      "https://mini-mindss.netlify.app",
                      "http://localhost:4200",
                      "https://localhost:4200"
                  )
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        });
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
    });

// Add HttpClient for AI services
builder.Services.AddHttpClient();

// Add SignalR
builder.Services.AddSignalR();

// Add Notification Service
builder.Services.AddScoped<DaycareAPI.Services.INotificationService, DaycareAPI.Services.NotificationService>();
builder.Services.AddScoped<DaycareAPI.Services.NotificationService>();

// Configure Stripe
Stripe.StripeConfiguration.ApiKey = builder.Configuration["STRIPE_SECRET_KEY"] ?? builder.Configuration["Stripe:SecretKey"];

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Database creation temporarily disabled

// Database seeding commented out temporarily
// _ = Task.Run(async () =>
// {
//     var connectionString2 = builder.Configuration.GetConnectionString("DefaultConnection");
//     if (!string.IsNullOrEmpty(connectionString2))
//     {
//         using (var scope = app.Services.CreateScope())
//         {
//             var services = scope.ServiceProvider;
//             try
//             {
//                 var context = services.GetRequiredService<ApplicationDbContext>();
//                 var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
//                 var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
// 
//                 await context.Database.EnsureCreatedAsync();
//                 Console.WriteLine("Database connection established.");
// 
//                 await DatabaseSeeder.SeedAsync(context, userManager, roleManager);
//                 Console.WriteLine("Database seeded successfully.");
//             }
//             catch (Exception ex)
//             {
//                 Console.WriteLine($"Database seeding failed: {ex.Message}");
//                 Console.WriteLine("App will continue running without seeded data.");
//             }
//         }
//     }
//     else
//     {
//         Console.WriteLine("No database connection string found. Skipping database operations.");
//     }
// });

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAngularApp");

// Serve static files
app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

// Add health check endpoint
app.MapGet("/", () => "MiniMinds API is running!");
app.MapGet("/health", () => "OK");
app.MapGet("/api/test", () => new { message = "API is working!", timestamp = DateTime.UtcNow });
app.MapPost("/api/test", () => new { message = "POST request successful!", timestamp = DateTime.UtcNow });

// Enable all controllers (database temporarily disabled)
app.MapControllers();
Console.WriteLine("Controllers enabled - database operations will fail but API structure works");
app.MapHub<DaycareAPI.Hubs.NotificationHub>("/notificationHub");

// Configure URL for Render
var port = Environment.GetEnvironmentVariable("PORT") ?? "10000";
app.Urls.Add($"http://0.0.0.0:{port}");
Console.WriteLine($"Server running at: http://0.0.0.0:{port}");

app.Run();