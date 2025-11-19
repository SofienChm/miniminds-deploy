using DaycareAPI.Data;
using DaycareAPI.Models;
using DaycareAPI.Hubs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace DaycareAPI.Services
{
    public interface INotificationService
    {
        Task SendEventNotificationToParentsAsync(Event eventItem);
        Task SendNotificationAsync(string userId, string title, string message, string type = "General", string? redirectUrl = null);
    }

    public class NotificationService : INotificationService
    {
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<NotificationHub> _hubContext;

        public NotificationService(ApplicationDbContext context, IHubContext<NotificationHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        public async Task SendEventNotificationToParentsAsync(Event eventItem)
        {
            try
            {
                // Get all users with Parent role
                var parentUsers = await _context.Users
                    .Join(_context.UserRoles, u => u.Id, ur => ur.UserId, (u, ur) => new { User = u, ur.RoleId })
                    .Join(_context.Roles, x => x.RoleId, r => r.Id, (x, r) => new { x.User, Role = r })
                    .Where(x => x.Role.Name == "Parent")
                    .Select(x => x.User)
                    .ToListAsync();

                Console.WriteLine($"Found {parentUsers.Count} parent users for event notification");
                
                foreach (var user in parentUsers)
                {
                    Console.WriteLine($"Sending notification to parent: {user.Email}");
                    await SendNotificationAsync(
                        user.Id,
                        "New Event Created",
                        $"A new event '{eventItem.Name}' has been scheduled. Check it out!",
                        "Event",
                        $"/events/{eventItem.Id}"
                    );
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error sending event notifications: {ex.Message}");
            }
        }

        public async Task SendNotificationAsync(string userId, string title, string message, string type = "General", string? redirectUrl = null)
        {
            try
            {
                var notification = new Notification
                {
                    UserId = userId,
                    Title = title,
                    Message = message,
                    Type = type,
                    RedirectUrl = redirectUrl,
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Notifications.Add(notification);
                await _context.SaveChangesAsync();
                
                Console.WriteLine($"Notification saved to DB for user {userId}: {title}");

                // Send real-time notification via SignalR
                await _hubContext.Clients.Group($"User_{userId}").SendAsync("ReceiveNotification", new
                {
                    id = notification.Id,
                    userId = notification.UserId,
                    title = notification.Title,
                    message = notification.Message,
                    type = notification.Type,
                    redirectUrl = notification.RedirectUrl,
                    isRead = notification.IsRead,
                    createdAt = notification.CreatedAt
                });
                
                Console.WriteLine($"SignalR notification sent to User_{userId}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error sending notification: {ex.Message}");
            }
        }
    }
}