using DaycareAPI.Data;
using DaycareAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DaycareAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class TestController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly INotificationService _notificationService;

        public TestController(ApplicationDbContext context, INotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        [HttpGet("parent-users")]
        public async Task<IActionResult> GetParentUsers()
        {
            var parentUsers = await _context.Users
                .Join(_context.UserRoles, u => u.Id, ur => ur.UserId, (u, ur) => new { User = u, ur.RoleId })
                .Join(_context.Roles, x => x.RoleId, r => r.Id, (x, r) => new { x.User, Role = r })
                .Where(x => x.Role.Name == "Parent")
                .Select(x => new { x.User.Id, x.User.Email, x.User.FirstName, x.User.LastName })
                .ToListAsync();

            return Ok(new { count = parentUsers.Count, users = parentUsers });
        }

        [HttpPost("send-test-notification")]
        public async Task<IActionResult> SendTestNotification()
        {
            var parentUsers = await _context.Users
                .Join(_context.UserRoles, u => u.Id, ur => ur.UserId, (u, ur) => new { User = u, ur.RoleId })
                .Join(_context.Roles, x => x.RoleId, r => r.Id, (x, r) => new { x.User, Role = r })
                .Where(x => x.Role.Name == "Parent")
                .Select(x => x.User)
                .ToListAsync();

            foreach (var user in parentUsers)
            {
                await _notificationService.SendNotificationAsync(
                    user.Id,
                    "Test Notification",
                    "This is a test notification to verify the system works.",
                    "Test",
                    "/dashboard"
                );
            }

            return Ok(new { message = $"Test notifications sent to {parentUsers.Count} parents" });
        }
    }
}