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
    public class AttendanceController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AttendanceController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Attendance
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Attendance>>> GetAttendances()
        {
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            
            if (userRole == "Parent")
            {
                var parentIdClaim = User.FindFirst("ParentId")?.Value;
                if (int.TryParse(parentIdClaim, out int parentId))
                {
                    return await _context.Attendances
                        .Include(a => a.Child)
                        .ThenInclude(c => c.Parent)
                        .Where(a => a.Child.ParentId == parentId)
                        .OrderByDescending(a => a.Date)
                        .ThenByDescending(a => a.CheckInTime)
                        .ToListAsync();
                }
                return Forbid();
            }
            
            // Admin and Teacher can see all attendance
            return await _context.Attendances
                .Include(a => a.Child)
                .ThenInclude(c => c.Parent)
                .OrderByDescending(a => a.Date)
                .ThenByDescending(a => a.CheckInTime)
                .ToListAsync();
        }

        // GET: api/Attendance/Weekly
        [HttpGet("Weekly")]
        public async Task<ActionResult<IEnumerable<object>>> GetWeeklyAttendance()
        {
            var today = DateTime.UtcNow.Date;
            var startOfWeek = today.AddDays(-(int)today.DayOfWeek);
            var endOfWeek = startOfWeek.AddDays(6);

            var weeklyData = await _context.Attendances
                .Where(a => a.Date >= startOfWeek && a.Date <= endOfWeek)
                .GroupBy(a => a.Date.DayOfWeek)
                .Select(g => new
                {
                    day = g.Key.ToString(),
                    presentCount = g.Count()
                })
                .ToListAsync();

            var daysOfWeek = new[] { DayOfWeek.Sunday, DayOfWeek.Monday, DayOfWeek.Tuesday, DayOfWeek.Wednesday, DayOfWeek.Thursday, DayOfWeek.Friday, DayOfWeek.Saturday };
            var result = daysOfWeek.Select(day => new
            {
                day = day.ToString(),
                presentCount = weeklyData.FirstOrDefault(w => w.day == day.ToString())?.presentCount ?? 0
            });

            return Ok(result);
        }

        // GET: api/Attendance/ByChild/5
        [HttpGet("ByChild/{childId}")]
        public async Task<ActionResult<IEnumerable<Attendance>>> GetAttendanceByChild(int childId)
        {
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            
            if (userRole == "Parent")
            {
                var parentIdClaim = User.FindFirst("ParentId")?.Value;
                if (int.TryParse(parentIdClaim, out int parentId))
                {
                    var child = await _context.Children.FirstOrDefaultAsync(c => c.Id == childId && c.ParentId == parentId);
                    if (child == null)
                        return Forbid();
                }
                else
                {
                    return Forbid();
                }
            }
            
            return await _context.Attendances
                .Where(a => a.ChildId == childId)
                .Include(a => a.Child)
                .OrderByDescending(a => a.Date)
                .ToListAsync();
        }

        // GET: api/Attendance/ByDate?date=2024-01-01
        [HttpGet("ByDate")]
        public async Task<ActionResult<IEnumerable<Attendance>>> GetAttendanceByDate([FromQuery] DateTime date)
        {
            var targetDate = date.Date;

            return await _context.Attendances
                .Where(a => a.Date.Date == targetDate)
                .Include(a => a.Child)
                .ThenInclude(c => c.Parent)
                .OrderBy(a => a.CheckInTime)
                .ToListAsync();
        }

        // GET: api/Attendance/Today
        [HttpGet("Today")]
        [AllowAnonymous]
        public async Task<ActionResult<object>> GetTodayAttendance()
        {
            // Return sample attendance data for testing
            var sampleData = new
            {
                totalPresent = 15,
                totalAbsent = 3,
                checkInsToday = 15,
                checkOutsToday = 12
            };
            return Ok(sampleData);
        }

        // GET: api/Attendance/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Attendance>> GetAttendance(int id)
        {
            var attendance = await _context.Attendances
                .Include(a => a.Child)
                .ThenInclude(c => c.Parent)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (attendance == null)
                return NotFound();
                
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            if (userRole == "Parent")
            {
                var parentIdClaim = User.FindFirst("ParentId")?.Value;
                if (int.TryParse(parentIdClaim, out int parentId) && attendance.Child.ParentId != parentId)
                {
                    return Forbid();
                }
            }

            return attendance;
        }

        // POST: api/Attendance/CheckIn
        [HttpPost("CheckIn")]
        [Authorize(Roles = "Admin,Teacher")]
        public async Task<ActionResult<Attendance>> CheckIn([FromBody] Attendance attendance)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Verify child exists
            var childExists = await _context.Children.AnyAsync(c => c.Id == attendance.ChildId);
            if (!childExists)
                return BadRequest(new { message = "Child not found" });

            // Check if already checked in today
            var today = DateTime.UtcNow.Date;
            var existingAttendance = await _context.Attendances
                .FirstOrDefaultAsync(a => a.ChildId == attendance.ChildId && 
                                         a.Date.Date == today && 
                                         a.CheckOutTime == null);

            if (existingAttendance != null)
                return BadRequest(new { message = "Child is already checked in today" });

            attendance.Date = DateTime.UtcNow.Date;
            attendance.CheckInTime = DateTime.UtcNow;
            attendance.CreatedAt = DateTime.UtcNow;

            _context.Attendances.Add(attendance);
            
            // Create a daily activity for check-in
            var checkInActivity = new DailyActivity
            {
                ChildId = attendance.ChildId,
                ActivityType = "Check-in",
                ActivityTime = attendance.CheckInTime,
                Notes = "Child arrived at daycare",
                CreatedAt = DateTime.UtcNow
            };
            _context.DailyActivities.Add(checkInActivity);
            
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetAttendance), new { id = attendance.Id }, attendance);
        }

        // POST: api/Attendance/CheckOut/5
        [HttpPost("CheckOut/{id}")]
        [Authorize(Roles = "Admin,Teacher")]
        public async Task<IActionResult> CheckOut(int id, [FromBody] string? checkOutNotes)
        {
            var attendance = await _context.Attendances.FindAsync(id);
            if (attendance == null)
                return NotFound();

            if (attendance.CheckOutTime != null)
                return BadRequest(new { message = "Child is already checked out" });

            attendance.CheckOutTime = DateTime.UtcNow;
            attendance.CheckOutNotes = checkOutNotes;
            attendance.UpdatedAt = DateTime.UtcNow;
            
            // Create a daily activity for check-out
            var checkOutActivity = new DailyActivity
            {
                ChildId = attendance.ChildId,
                ActivityType = "Check-out",
                ActivityTime = attendance.CheckOutTime.Value,
                Notes = !string.IsNullOrEmpty(checkOutNotes) ? checkOutNotes : "Child left daycare",
                CreatedAt = DateTime.UtcNow
            };
            _context.DailyActivities.Add(checkOutActivity);

            await _context.SaveChangesAsync();

            return Ok(attendance);
        }

        // PUT: api/Attendance/5
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Teacher")]
        public async Task<IActionResult> UpdateAttendance(int id, Attendance attendance)
        {
            if (id != attendance.Id)
                return BadRequest();

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            attendance.UpdatedAt = DateTime.UtcNow;
            _context.Entry(attendance).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!AttendanceExists(id))
                    return NotFound();
                throw;
            }

            return NoContent();
        }

        // DELETE: api/Attendance/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Teacher")]
        public async Task<IActionResult> DeleteAttendance(int id)
        {
            var attendance = await _context.Attendances.FindAsync(id);
            if (attendance == null)
                return NotFound();

            _context.Attendances.Remove(attendance);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool AttendanceExists(int id)
        {
            return _context.Attendances.Any(e => e.Id == id);
        }
    }
}