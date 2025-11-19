using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using DaycareAPI.Data;
using DaycareAPI.Models;
using DaycareAPI.DTOs;
using System.Security.Claims;

namespace DaycareAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ReclamationsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public ReclamationsController(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        private string GetCurrentUserId()
        {
            // Get the LAST NameIdentifier claim (the GUID, not the email)
            var userIdClaim = User.Claims
                .Where(c => c.Type == ClaimTypes.NameIdentifier)
                .LastOrDefault();
            
            if (userIdClaim != null && !string.IsNullOrEmpty(userIdClaim.Value))
            {
                return userIdClaim.Value;
            }
            
            return "";
        }

        [HttpGet("sent")]
        public async Task<ActionResult> GetSentReclamations()
        {
            var currentUserId = GetCurrentUserId();
            
            var reclamations = await _context.Reclamations
                .Include(r => r.Recipient)
                .Where(r => r.SenderId == currentUserId)
                .OrderByDescending(r => r.SentAt)
                .ToListAsync();

            return Ok(reclamations);
        }

        [HttpGet("received")]
        public async Task<ActionResult> GetReceivedReclamations()
        {
            var currentUserId = GetCurrentUserId();
            
            var reclamations = await _context.Reclamations
                .Include(r => r.Sender)
                .Where(r => r.RecipientId == currentUserId)
                .OrderByDescending(r => r.SentAt)
                .ToListAsync();

            return Ok(reclamations);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult> GetReclamation(int id)
        {
            var currentUserId = GetCurrentUserId();
            
            var reclamation = await _context.Reclamations
                .Include(r => r.Sender)
                .Include(r => r.Recipient)
                .FirstOrDefaultAsync(r => r.Id == id && 
                    (r.SenderId == currentUserId || r.RecipientId == currentUserId));

            if (reclamation == null)
                return NotFound();

            return Ok(reclamation);
        }

        [HttpPost]
        public async Task<ActionResult> SendReclamation([FromBody] SendReclamationDto reclamationDto)
        {
            if (string.IsNullOrEmpty(reclamationDto.Subject) || 
                string.IsNullOrEmpty(reclamationDto.Content) || 
                string.IsNullOrEmpty(reclamationDto.RecipientId))
            {
                return BadRequest(new { error = "Subject, Content and RecipientId are required" });
            }

            var currentUserId = GetCurrentUserId();
            
            var reclamation = new Reclamation
            {
                SenderId = currentUserId,
                RecipientId = reclamationDto.RecipientId,
                Subject = reclamationDto.Subject,
                Content = reclamationDto.Content,
                SentAt = DateTime.UtcNow,
                IsResolved = false
            };
            
            _context.Reclamations.Add(reclamation);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, reclamationId = reclamation.Id });
        }

        [HttpPut("{id}/resolve")]
        public async Task<IActionResult> ResolveReclamation(int id, [FromBody] string response)
        {
            var currentUserId = GetCurrentUserId();
            
            var reclamation = await _context.Reclamations
                .FirstOrDefaultAsync(r => r.Id == id && r.RecipientId == currentUserId);
                
            if (reclamation == null) 
                return NotFound();

            reclamation.IsResolved = true;
            reclamation.Response = response;
            reclamation.ResolvedAt = DateTime.UtcNow;
            
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpGet("users")]
        public async Task<ActionResult> GetUsers()
        {
            var currentUserId = GetCurrentUserId();
            var allUsers = await _context.Users.Where(u => u.Id != currentUserId).ToListAsync();
            
            var userList = new List<object>();
            foreach (var user in allUsers)
            {
                var roles = await _userManager.GetRolesAsync(user);
                var role = roles.FirstOrDefault() ?? "User";
                
                userList.Add(new
                {
                    Id = user.Id,
                    Name = user.FirstName + " " + user.LastName,
                    Email = user.Email,
                    Role = role
                });
            }

            return Ok(userList);
        }
        
        [HttpGet("admin")]
        public async Task<ActionResult> GetAdminUser()
        {
            var admins = await _userManager.GetUsersInRoleAsync("Admin");
            var admin = admins.FirstOrDefault();
            
            if (admin == null)
                return NotFound(new { error = "No admin user found" });
            
            return Ok(new
            {
                Id = admin.Id,
                Name = admin.FirstName + " " + admin.LastName,
                Email = admin.Email,
                Role = "Admin"
            });
        }
    }
}