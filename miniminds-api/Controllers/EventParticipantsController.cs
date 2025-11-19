using DaycareAPI.Data;
using DaycareAPI.Models;
using DaycareAPI.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace DaycareAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class EventParticipantsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public EventParticipantsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/EventParticipants/Event/5
        [HttpGet("Event/{eventId}")]
        public async Task<ActionResult<IEnumerable<EventParticipant>>> GetEventParticipants(int eventId)
        {
            return await _context.EventParticipants
                .Where(ep => ep.EventId == eventId)
                .Include(ep => ep.Child)
                .ThenInclude(c => c.Parent)
                .OrderBy(ep => ep.RegisteredAt)
                .ToListAsync();
        }

        // GET: api/EventParticipants/Child/5
        [HttpGet("Child/{childId}")]
        public async Task<ActionResult<IEnumerable<EventParticipant>>> GetChildParticipations(int childId)
        {
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            
            if (userRole == "Parent")
            {
                var parentIdClaim = User.FindFirst("ParentId")?.Value;
                if (int.TryParse(parentIdClaim, out int parentId))
                {
                    var child = await _context.Children.FindAsync(childId);
                    if (child?.ParentId != parentId)
                        return Forbid();
                }
            }

            return await _context.EventParticipants
                .Where(ep => ep.ChildId == childId)
                .Include(ep => ep.Event)
                .OrderByDescending(ep => ep.RegisteredAt)
                .ToListAsync();
        }

        // POST: api/EventParticipants
        [HttpPost]
        public async Task<ActionResult<EventParticipant>> RegisterParticipant(CreateEventParticipantDto dto)
        {
            Console.WriteLine("*** POST REQUEST RECEIVED - RegisterParticipant called!");
            Console.WriteLine($"*** DTO: EventId={dto.EventId}, ChildId={dto.ChildId}");
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                
                Console.WriteLine($"=== DEBUG INFO ===");
                Console.WriteLine($"User ID: {userId}");
                Console.WriteLine($"User Role: {userRole}");
                Console.WriteLine($"All Claims:");
                foreach (var claim in User.Claims)
                {
                    Console.WriteLine($"  {claim.Type}: {claim.Value}");
                }

            // Role-based validation
            if (userRole == "Parent")
            {
                var parentIdClaim = User.FindFirst("ParentId")?.Value;
                if (int.TryParse(parentIdClaim, out int parentId))
                {
                    var child = await _context.Children.FindAsync(dto.ChildId);
                    if (child?.ParentId != parentId)
                        return Forbid("You can only register your own children");
                }
            }

            // Check if already registered
            var existing = await _context.EventParticipants
                .FirstOrDefaultAsync(ep => ep.EventId == dto.EventId && ep.ChildId == dto.ChildId);
            
            if (existing != null)
                return BadRequest("Child is already registered for this event");

            // Check event capacity
            var eventItem = await _context.Events.FindAsync(dto.EventId);
            if (eventItem == null)
                return NotFound("Event not found");

            var currentParticipants = await _context.EventParticipants
                .CountAsync(ep => ep.EventId == dto.EventId && ep.Status == "Registered");

            if (currentParticipants >= eventItem.Capacity)
                return BadRequest("Event is at full capacity");

            // Set status based on user role - Parents always get Pending status
            var status = userRole == "Parent" ? "Pending" : "Registered";
            Console.WriteLine($"User role: {userRole}, Setting status: {status}");
            
            var participant = new EventParticipant
            {
                EventId = dto.EventId,
                ChildId = dto.ChildId,
                Notes = dto.Notes,
                RegisteredBy = userId!,
                RegisteredAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                Status = status
            };

            _context.EventParticipants.Add(participant);
            await _context.SaveChangesAsync();
            
            Console.WriteLine("*** TEST: PARTICIPANT SUCCESSFULLY CREATED! ***");
            Console.WriteLine($"*** TEST: Participant ID = {participant.Id}, Status = {participant.Status} ***");

            // Create notification for admin if parent registration
            Console.WriteLine($"*** NOTIFICATION CHECK: UserRole = {userRole}");
            if (userRole == "Parent")
            {
                Console.WriteLine("*** CREATING NOTIFICATION FOR ADMIN");
                try
                {
                    var child = await _context.Children.Include(c => c.Parent).FirstOrDefaultAsync(c => c.Id == dto.ChildId);
                    Console.WriteLine($"*** CHILD FOUND: {child?.FirstName} {child?.LastName}");
                    Console.WriteLine($"*** PARENT FOUND: {child?.Parent?.FirstName} {child?.Parent?.LastName}");
                    
                    var message = $"{child?.Parent?.FirstName} {child?.Parent?.LastName} wants to register {child?.FirstName} {child?.LastName} for {eventItem.Name}";
                    var redirectUrl = $"/events/{dto.EventId}/participants";
                    
                    Console.WriteLine($"*** NOTIFICATION MESSAGE: {message}");
                    Console.WriteLine($"*** REDIRECT URL: {redirectUrl}");
                    Console.WriteLine($"*** INSERTING NOTIFICATION FOR ADMIN (UserId=1)");
                    
                    var notification = new Notification
                    {
                        Type = "EventRegistration",
                        Title = "New Event Registration Request",
                        Message = message,
                        RedirectUrl = redirectUrl,
                        UserId = "1",
                        IsRead = false,
                        CreatedAt = DateTime.UtcNow
                    };
                    
                    _context.Notifications.Add(notification);
                    var rowsAffected = await _context.SaveChangesAsync();
                    Console.WriteLine($"*** NOTIFICATION SAVED! Rows affected: {rowsAffected}");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"*** ERROR CREATING NOTIFICATION: {ex.Message}");
                    Console.WriteLine($"*** STACK TRACE: {ex.StackTrace}");
                }
            }
            else
            {
                Console.WriteLine($"*** NOT CREATING NOTIFICATION - USER ROLE IS: {userRole}");
            }

            return CreatedAtAction(nameof(GetEventParticipants), 
                new { eventId = participant.EventId }, participant);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error registering participant: {ex.Message}");
            }
        }

        // DELETE: api/EventParticipants/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> RemoveParticipant(int id)
        {
            var participant = await _context.EventParticipants
                .Include(ep => ep.Child)
                .FirstOrDefaultAsync(ep => ep.Id == id);

            if (participant == null)
                return NotFound();

            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            
            // Role-based validation
            if (userRole == "Parent")
            {
                var parentIdClaim = User.FindFirst("ParentId")?.Value;
                if (int.TryParse(parentIdClaim, out int parentId))
                {
                    if (participant.Child.ParentId != parentId)
                        return Forbid("You can only remove your own children");
                }
            }

            _context.EventParticipants.Remove(participant);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // PUT: api/EventParticipants/5/approve
        [HttpPut("{id}/approve")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ApproveParticipant(int id)
        {
            var participant = await _context.EventParticipants.FindAsync(id);
            if (participant == null)
                return NotFound();

            participant.Status = "Registered";
            participant.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // PUT: api/EventParticipants/5/reject
        [HttpPut("{id}/reject")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> RejectParticipant(int id)
        {
            var participant = await _context.EventParticipants.FindAsync(id);
            if (participant == null)
                return NotFound();

            participant.Status = "Rejected";
            participant.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}