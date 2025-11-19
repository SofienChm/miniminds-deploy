using DaycareAPI.Data;
using DaycareAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DaycareAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class EventsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly DaycareAPI.Services.INotificationService _notificationService;

        public EventsController(ApplicationDbContext context, DaycareAPI.Services.INotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        // GET: api/Events
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Event>>> GetEvents()
        {
            return await _context.Events
                .Include(e => e.Participants)
                    .ThenInclude(p => p.Child)
                .OrderByDescending(e => e.CreatedAt)
                .ToListAsync();
        }

        // GET: api/Events/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Event>> GetEvent(int id)
        {
            var eventItem = await _context.Events
                .Include(e => e.Participants)
                    .ThenInclude(p => p.Child)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (eventItem == null)
                return NotFound();

            return eventItem;
        }

        // POST: api/Events
        [HttpPost]
        [Authorize(Roles = "Admin,Teacher")]
        public async Task<ActionResult<Event>> CreateEvent(Event eventItem)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            eventItem.CreatedAt = DateTime.UtcNow;
            _context.Events.Add(eventItem);
            await _context.SaveChangesAsync();

            // Send notification to all parents
            await _notificationService.SendEventNotificationToParentsAsync(eventItem);

            return CreatedAtAction(nameof(GetEvent), new { id = eventItem.Id }, eventItem);
        }

        // PUT: api/Events/5
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Teacher")]
        public async Task<IActionResult> UpdateEvent(int id, Event eventItem)
        {
            if (id != eventItem.Id)
                return BadRequest();

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            eventItem.UpdatedAt = DateTime.UtcNow;
            _context.Entry(eventItem).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!EventExists(id))
                    return NotFound();
                throw;
            }

            return NoContent();
        }

        // DELETE: api/Events/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Teacher")]
        public async Task<IActionResult> DeleteEvent(int id)
        {
            var eventItem = await _context.Events.FindAsync(id);
            if (eventItem == null)
                return NotFound();

            _context.Events.Remove(eventItem);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool EventExists(int id)
        {
            return _context.Events.Any(e => e.Id == id);
        }
    }
}