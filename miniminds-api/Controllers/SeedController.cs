using DaycareAPI.Data;
using DaycareAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace DaycareAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SeedController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;

        public SeedController(
            ApplicationDbContext context,
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole> roleManager)
        {
            _context = context;
            _userManager = userManager;
            _roleManager = roleManager;
        }

        /// <summary>
        /// Manually trigger database seeding
        /// </summary>
        /// <returns>Seeding result</returns>
        [HttpPost("run")]
        public async Task<IActionResult> RunSeeder()
        {
            try
            {
                await DatabaseSeeder.SeedAsync(_context, _userManager, _roleManager);

                return Ok(new
                {
                    success = true,
                    message = "Database seeded successfully!",
                    timestamp = DateTime.Now
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Error seeding database",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Clear all data from the database (USE WITH CAUTION!)
        /// </summary>
        /// <returns>Clear result</returns>
        [HttpDelete("clear")]
        public async Task<IActionResult> ClearDatabase()
        {
            try
            {
                // Remove all data in correct order (respecting foreign key constraints)
                _context.EventParticipants.RemoveRange(_context.EventParticipants);
                _context.ProgramEnrollments.RemoveRange(_context.ProgramEnrollments);
                _context.ClassEnrollments.RemoveRange(_context.ClassEnrollments);
                _context.ClassTeachers.RemoveRange(_context.ClassTeachers);
                _context.ChildParents.RemoveRange(_context.ChildParents);
                _context.LeaveRequests.RemoveRange(_context.LeaveRequests);
                _context.Messages.RemoveRange(_context.Messages);
                _context.Fees.RemoveRange(_context.Fees);
                _context.Notifications.RemoveRange(_context.Notifications);
                _context.DailyActivities.RemoveRange(_context.DailyActivities);
                _context.Attendances.RemoveRange(_context.Attendances);
                _context.Events.RemoveRange(_context.Events);
                _context.Holidays.RemoveRange(_context.Holidays);
                _context.Classes.RemoveRange(_context.Classes);
                _context.DaycarePrograms.RemoveRange(_context.DaycarePrograms);
                _context.Children.RemoveRange(_context.Children);
                _context.Parents.RemoveRange(_context.Parents);
                _context.Teachers.RemoveRange(_context.Teachers);
                _context.AppSettings.RemoveRange(_context.AppSettings);

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    success = true,
                    message = "Database cleared successfully!",
                    timestamp = DateTime.Now
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Error clearing database",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Reset database - Clear and reseed
        /// </summary>
        /// <returns>Reset result</returns>
        [HttpPost("reset")]
        public async Task<IActionResult> ResetDatabase()
        {
            try
            {
                // Clear existing data in correct order
                _context.EventParticipants.RemoveRange(_context.EventParticipants);
                _context.ProgramEnrollments.RemoveRange(_context.ProgramEnrollments);
                _context.ClassEnrollments.RemoveRange(_context.ClassEnrollments);
                _context.ClassTeachers.RemoveRange(_context.ClassTeachers);
                _context.ChildParents.RemoveRange(_context.ChildParents);
                _context.LeaveRequests.RemoveRange(_context.LeaveRequests);
                _context.Messages.RemoveRange(_context.Messages);
                _context.Fees.RemoveRange(_context.Fees);
                _context.Notifications.RemoveRange(_context.Notifications);
                _context.DailyActivities.RemoveRange(_context.DailyActivities);
                _context.Attendances.RemoveRange(_context.Attendances);
                _context.Events.RemoveRange(_context.Events);
                _context.Holidays.RemoveRange(_context.Holidays);
                _context.Classes.RemoveRange(_context.Classes);
                _context.DaycarePrograms.RemoveRange(_context.DaycarePrograms);
                _context.Children.RemoveRange(_context.Children);
                _context.Parents.RemoveRange(_context.Parents);
                _context.Teachers.RemoveRange(_context.Teachers);
                _context.AppSettings.RemoveRange(_context.AppSettings);

                await _context.SaveChangesAsync();

                // Reseed
                await DatabaseSeeder.SeedAsync(_context, _userManager, _roleManager);

                return Ok(new
                {
                    success = true,
                    message = "Database reset and reseeded successfully!",
                    timestamp = DateTime.Now
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Error resetting database",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Get seeding status
        /// </summary>
        /// <returns>Database statistics</returns>
        [HttpGet("status")]
        public IActionResult GetStatus()
        {
            var stats = new
            {
                appSettings = _context.AppSettings.Count(),
                teachers = _context.Teachers.Count(),
                parents = _context.Parents.Count(),
                children = _context.Children.Count(),
                programs = _context.DaycarePrograms.Count(),
                classes = _context.Classes.Count(),
                events = _context.Events.Count(),
                holidays = _context.Holidays.Count(),
                fees = _context.Fees.Count(),
                messages = _context.Messages.Count(),
                leaveRequests = _context.LeaveRequests.Count(),
                childParents = _context.ChildParents.Count(),
                classEnrollments = _context.ClassEnrollments.Count(),
                programEnrollments = _context.ProgramEnrollments.Count(),
                eventParticipants = _context.EventParticipants.Count(),
                classTeachers = _context.ClassTeachers.Count(),
                attendances = _context.Attendances.Count(),
                dailyActivities = _context.DailyActivities.Count(),
                notifications = _context.Notifications.Count(),
                timestamp = DateTime.Now
            };

            return Ok(stats);
        }
    }
}