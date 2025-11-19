using DaycareAPI.Data;
using DaycareAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace DaycareAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public NotificationsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Notifications
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Notification>>> GetNotifications([FromQuery] bool includeRead = false)
        {
            // Try to get UserId from different claim types
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var originalUserId = userId;
            
            // If NameIdentifier is email, try to find the actual user ID
            if (!string.IsNullOrEmpty(userId) && userId.Contains("@"))
            {
                Console.WriteLine($"Converting email {userId} to user GUID...");
                // It's an email, find the user by email
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == userId);
                if (user != null)
                {
                    Console.WriteLine($"Found user with GUID: {user.Id}");
                    userId = user.Id;
                }
                else
                {
                    Console.WriteLine($"No user found with email: {userId}");
                }
            }
            
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            
            Console.WriteLine($"GetNotifications - Original: {originalUserId}, Converted: {userId}, Role: {userRole}, IncludeRead: {includeRead}");
            
            if (string.IsNullOrEmpty(userId))
            {
                return Ok(new List<Notification>());
            }
            
            var query = _context.Notifications.AsQueryable();
            
            // Filter by user - Admin sees all, others see only their own
            if (userRole != "Admin")
            {
                query = query.Where(n => n.UserId == userId);
                Console.WriteLine($"Filtering notifications for non-admin user: {userId}");
            }
            
            if (!includeRead)
            {
                query = query.Where(n => !n.IsRead);
            }
            
            var notifications = await query
                .OrderByDescending(n => n.CreatedAt)
                .ToListAsync();
            
            Console.WriteLine($"Found {notifications.Count} notifications for user {userId}");
            foreach (var n in notifications)
            {
                Console.WriteLine($"  - Notification ID: {n.Id}, UserId: {n.UserId}, Title: {n.Title}");
            }
            
            // Add default redirect URLs for notifications that don't have them
            foreach (var n in notifications)
            {
                if (string.IsNullOrEmpty(n.RedirectUrl) && n.Type == "EventRegistration")
                {
                    n.RedirectUrl = "/events";
                }
            }
            
            return notifications;
        }

        // GET: api/Notifications/All
        [HttpGet("All")]
        public async Task<ActionResult<IEnumerable<Notification>>> GetAllNotifications()
        {
            Console.WriteLine("*** Getting all notifications");
            return await _context.Notifications
                .OrderByDescending(n => n.CreatedAt)
                .ToListAsync();
        }

        // GET: api/Notifications/Unread
        [HttpGet("Unread")]
        public async Task<ActionResult<IEnumerable<Notification>>> GetUnreadNotifications()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                
                // If NameIdentifier is email, convert to user ID
                if (!string.IsNullOrEmpty(userId) && userId.Contains("@"))
                {
                    var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == userId);
                    if (user != null) userId = user.Id;
                }
                
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
                
                if (string.IsNullOrEmpty(userId))
                {
                    return Ok(new List<Notification>());
                }
                
                var query = _context.Notifications.Where(n => !n.IsRead);
                
                // Filter by user - Admin sees all, others see only their own
                if (userRole != "Admin")
                {
                    query = query.Where(n => n.UserId == userId);
                }
                
                var notifications = await query
                    .OrderByDescending(n => n.CreatedAt)
                    .ToListAsync();
                    
                return Ok(notifications);
            }
            catch (Exception ex)
            {
                return Ok(new List<Notification>());
            }
        }

        // GET: api/Notifications/Count
        [HttpGet("Count")]
        public async Task<ActionResult<object>> GetUnreadCount()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                
                // If NameIdentifier is email, convert to user ID
                if (!string.IsNullOrEmpty(userId) && userId.Contains("@"))
                {
                    var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == userId);
                    if (user != null) userId = user.Id;
                }
                
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
                
                if (string.IsNullOrEmpty(userId))
                {
                    return new { count = 0 };
                }
                
                var query = _context.Notifications.Where(n => !n.IsRead);
                
                // Filter by user - Admin sees all, others see only their own
                if (userRole != "Admin")
                {
                    query = query.Where(n => n.UserId == userId);
                }
                
                var count = await query.CountAsync();
                    
                return new { count };
            }
            catch (Exception ex)
            {
                return new { count = 0 };
            }
        }

        // PUT: api/Notifications/5/read
        [HttpPut("{id}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var notification = await _context.Notifications.FindAsync(id);
            if (notification == null)
                return NotFound();

            notification.IsRead = true;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // POST: api/Notifications/MarkAsRead/5
        [HttpPost("MarkAsRead/{id}")]
        public async Task<IActionResult> MarkAsReadPost(int id)
        {
            var notification = await _context.Notifications.FindAsync(id);
            if (notification == null)
                return NotFound();

            notification.IsRead = true;
            await _context.SaveChangesAsync();

            return Ok();
        }

        // POST: api/Notifications/MarkAllAsRead
        [HttpPost("MarkAllAsRead")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            // If NameIdentifier is email, convert to user ID
            if (!string.IsNullOrEmpty(userId) && userId.Contains("@"))
            {
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == userId);
                if (user != null) userId = user.Id;
            }
            
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            
            if (string.IsNullOrEmpty(userId))
            {
                return BadRequest();
            }
            
            var query = _context.Notifications.Where(n => !n.IsRead);
            
            // Filter by user - Admin marks all, others mark only their own
            if (userRole != "Admin")
            {
                query = query.Where(n => n.UserId == userId);
            }
            
            var notifications = await query.ToListAsync();

            foreach (var notification in notifications)
            {
                notification.IsRead = true;
            }

            await _context.SaveChangesAsync();
            return Ok();
        }

        // DELETE: api/Notifications/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNotification(int id)
        {
            var notification = await _context.Notifications.FindAsync(id);
            if (notification == null)
                return NotFound();

            _context.Notifications.Remove(notification);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // POST: api/Notifications/test
        [HttpPost("test")]
        public async Task<IActionResult> TestNotification()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            if (!string.IsNullOrEmpty(userId) && userId.Contains("@"))
            {
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == userId);
                if (user != null) userId = user.Id;
            }

            if (string.IsNullOrEmpty(userId))
            {
                return BadRequest("User not found");
            }

            var notificationService = HttpContext.RequestServices.GetRequiredService<DaycareAPI.Services.INotificationService>();
            
            await notificationService.SendNotificationAsync(
                userId,
                "Test Notification",
                "This is a test notification to verify SignalR is working",
                "Test",
                "/"
            );

            return Ok(new { message = "Test notification sent", userId });
        }
    }
}