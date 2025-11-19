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
    public class HolidaysController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public HolidaysController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Holidays
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Holiday>>> GetHolidays()
        {
            return await _context.Holidays
                .OrderBy(h => h.Date)
                .ToListAsync();
        }

        // GET: api/Holidays/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Holiday>> GetHoliday(int id)
        {
            var holiday = await _context.Holidays.FindAsync(id);

            if (holiday == null)
                return NotFound();

            return holiday;
        }

        // POST: api/Holidays
        [HttpPost]
        [Authorize(Roles = "Admin,Teacher")]
        public async Task<ActionResult<Holiday>> CreateHoliday(Holiday holiday)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            holiday.CreatedAt = DateTime.UtcNow;
            _context.Holidays.Add(holiday);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetHoliday), new { id = holiday.Id }, holiday);
        }

        // PUT: api/Holidays/5
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Teacher")]
        public async Task<IActionResult> UpdateHoliday(int id, Holiday holiday)
        {
            if (id != holiday.Id)
                return BadRequest();

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            holiday.UpdatedAt = DateTime.UtcNow;
            _context.Entry(holiday).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!HolidayExists(id))
                    return NotFound();
                throw;
            }

            return NoContent();
        }

        // DELETE: api/Holidays/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteHoliday(int id)
        {
            var holiday = await _context.Holidays.FindAsync(id);
            if (holiday == null)
                return NotFound();

            _context.Holidays.Remove(holiday);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool HolidayExists(int id)
        {
            return _context.Holidays.Any(h => h.Id == id);
        }
    }
}
