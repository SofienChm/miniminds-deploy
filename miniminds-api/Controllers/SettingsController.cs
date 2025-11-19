using DaycareAPI.Data;
using DaycareAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DaycareAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SettingsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public SettingsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAll()
        {
            var settings = await _context.AppSettings.ToListAsync();
            return Ok(settings);
        }

        [HttpGet("{key}")]
        public async Task<IActionResult> GetByKey(string key)
        {
            var setting = await _context.AppSettings.FirstOrDefaultAsync(s => s.Key == key);
            if (setting == null)
                return NotFound();
            return Ok(setting);
        }

        [HttpPut("{key}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(string key, [FromBody] UpdateSettingDto dto)
        {
            var setting = await _context.AppSettings.FirstOrDefaultAsync(s => s.Key == key);
            if (setting == null)
            {
                setting = new AppSetting { Key = key, Value = dto.Value };
                _context.AppSettings.Add(setting);
            }
            else
            {
                setting.Value = dto.Value;
                setting.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return Ok(setting);
        }

        public class UpdateSettingDto
        {
            public string Value { get; set; } = string.Empty;
        }
    }
}
