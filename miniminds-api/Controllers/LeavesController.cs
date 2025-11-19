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
    public class LeavesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public LeavesController(ApplicationDbContext context)
        {
            _context = context;
        }

        private int? GetCurrentTeacherId()
        {
            var role = User.FindFirst(ClaimTypes.Role)?.Value;
            if (role == "Teacher")
            {
                var teacherIdStr = User.FindFirst("TeacherId")?.Value;
                if (int.TryParse(teacherIdStr, out var teacherId))
                    return teacherId;
            }
            return null;
        }

        private string? GetCurrentUserId()
        {
            return User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        }

        private async Task<int> GetDefaultAnnualLeaveDays()
        {
            var setting = await _context.AppSettings.FirstOrDefaultAsync(s => s.Key == "DefaultAnnualLeaveDays");
            return setting != null && int.TryParse(setting.Value, out var days) ? days : 30;
        }

        private async Task<int> GetDefaultMedicalLeaveDays()
        {
            var setting = await _context.AppSettings.FirstOrDefaultAsync(s => s.Key == "DefaultMedicalLeaveDays");
            return setting != null && int.TryParse(setting.Value, out var days) ? days : 10;
        }

        public class CreateLeaveRequestDto
        {
            public DateTime StartDate { get; set; }
            public DateTime EndDate { get; set; }
            public string? Reason { get; set; }
            public string LeaveType { get; set; } = "Annual";
        }

        public class AdminCreateLeaveRequestDto
        {
            public int TeacherId { get; set; }
            public DateTime StartDate { get; set; }
            public DateTime EndDate { get; set; }
            public string? Reason { get; set; }
            public string LeaveType { get; set; } = "Annual";
            public bool Approve { get; set; } = true;
        }

        [HttpPost("request")]
        [Authorize(Roles = "Teacher")]
        public async Task<IActionResult> RequestLeave([FromBody] CreateLeaveRequestDto dto)
        {
            var teacherId = GetCurrentTeacherId();
            if (teacherId == null)
                return Forbid();

            if (dto.StartDate.Date > dto.EndDate.Date)
                return BadRequest(new { message = "End date must be on or after start date." });

            var days = (int)(dto.EndDate.Date - dto.StartDate.Date).TotalDays + 1;
            if (days <= 0)
                return BadRequest(new { message = "Invalid leave duration." });

            var teacher = await _context.Teachers.FirstOrDefaultAsync(t => t.Id == teacherId.Value);
            if (teacher == null)
                return NotFound(new { message = "Teacher not found." });

            var request = new LeaveRequest
            {
                TeacherId = teacherId.Value,
                StartDate = dto.StartDate.Date,
                EndDate = dto.EndDate.Date,
                Days = days,
                Reason = dto.Reason?.Trim(),
                LeaveType = dto.LeaveType ?? "Annual",
                Status = "Pending",
                RequestedAt = DateTime.UtcNow
            };

            _context.LeaveRequests.Add(request);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetMyRequests), new { id = request.Id }, request);
        }

        [HttpGet("my")]
        [Authorize(Roles = "Teacher")]
        public async Task<IActionResult> GetMyRequests()
        {
            var teacherId = GetCurrentTeacherId();
            if (teacherId == null)
                return Forbid();

            var requests = await _context.LeaveRequests
                .Where(r => r.TeacherId == teacherId.Value)
                .OrderByDescending(r => r.RequestedAt)
                .ToListAsync();

            return Ok(requests);
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAll([FromQuery] string? status = "All")
        {
            var query = _context.LeaveRequests
                .Include(r => r.Teacher)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(status) && status != "All")
            {
                query = query.Where(r => r.Status == status);
            }

            var requests = await query
                .OrderByDescending(r => r.RequestedAt)
                .ToListAsync();

            return Ok(requests);
        }

        [HttpPost("admin/create")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateForTeacher([FromBody] AdminCreateLeaveRequestDto dto)
        {
            if (dto.StartDate.Date > dto.EndDate.Date)
                return BadRequest(new { message = "End date must be on or after start date." });

            var days = (int)(dto.EndDate.Date - dto.StartDate.Date).TotalDays + 1;
            if (days <= 0)
                return BadRequest(new { message = "Invalid leave duration." });

            var teacher = await _context.Teachers.FirstOrDefaultAsync(t => t.Id == dto.TeacherId);
            if (teacher == null)
                return NotFound(new { message = "Teacher not found." });

            var leaveType = dto.LeaveType ?? "Annual";
            var request = new LeaveRequest
            {
                TeacherId = teacher.Id,
                StartDate = dto.StartDate.Date,
                EndDate = dto.EndDate.Date,
                Days = days,
                Reason = dto.Reason?.Trim(),
                LeaveType = leaveType,
                Status = dto.Approve ? "Approved" : "Pending",
                RequestedAt = DateTime.UtcNow,
                ApprovedAt = null,
                ApprovedByUserId = null
            };

            if (dto.Approve)
            {
                var year = request.StartDate.Year;
                var usedDays = await _context.LeaveRequests
                    .Where(r => r.TeacherId == teacher.Id && r.Status == "Approved" && r.StartDate.Year == year && r.LeaveType == leaveType)
                    .SumAsync(r => (int?)r.Days) ?? 0;

                var maxDays = leaveType == "Medical" ? teacher.MedicalLeaveDays : teacher.AnnualLeaveDays;
                if (usedDays + request.Days > maxDays)
                {
                    return BadRequest(new { message = $"Insufficient {leaveType.ToLower()} leave balance.", remaining = maxDays - usedDays });
                }

                request.ApprovedAt = DateTime.UtcNow;
                request.ApprovedByUserId = null;
            }

            _context.LeaveRequests.Add(request);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetAll), new { id = request.Id }, request);
        }

        [HttpPut("{id:int}/approve")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Approve(int id)
        {
            var request = await _context.LeaveRequests.FirstOrDefaultAsync(r => r.Id == id);
            if (request == null) return NotFound(new { message = "Leave request not found." });

            var teacher = await _context.Teachers.FirstOrDefaultAsync(t => t.Id == request.TeacherId);
            if (teacher == null) return NotFound(new { message = "Teacher not found." });

            var year = request.StartDate.Year;
            var usedDays = await _context.LeaveRequests
                .Where(r => r.TeacherId == teacher.Id && r.Status == "Approved" && r.StartDate.Year == year && r.LeaveType == request.LeaveType && r.Id != id)
                .SumAsync(r => (int?)r.Days) ?? 0;

            var maxDays = request.LeaveType == "Medical" ? teacher.MedicalLeaveDays : teacher.AnnualLeaveDays;
            if (usedDays + request.Days > maxDays)
            {
                return BadRequest(new { message = $"Insufficient {request.LeaveType.ToLower()} leave balance.", remaining = maxDays - usedDays });
            }

            request.Status = "Approved";
            request.ApprovedAt = DateTime.UtcNow;
            request.ApprovedByUserId = null;

            await _context.SaveChangesAsync();
            return Ok(request);
        }

        [HttpPut("{id:int}/reject")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Reject(int id)
        {
            var request = await _context.LeaveRequests.FirstOrDefaultAsync(r => r.Id == id);
            if (request == null) return NotFound(new { message = "Leave request not found." });

            request.Status = "Rejected";
            request.ApprovedAt = DateTime.UtcNow;
            request.ApprovedByUserId = null;

            await _context.SaveChangesAsync();
            return Ok(request);
        }

        public class LeaveBalanceDto
        {
            public int AnnualAllocation { get; set; }
            public int AnnualUsedDays { get; set; }
            public int AnnualRemainingDays { get; set; }
            public int MedicalAllocation { get; set; }
            public int MedicalUsedDays { get; set; }
            public int MedicalRemainingDays { get; set; }
        }

        [HttpGet("balance")]
        [Authorize(Roles = "Teacher")]
        public async Task<IActionResult> GetMyBalance()
        {
            var teacherId = GetCurrentTeacherId();
            if (teacherId == null) return Forbid();

            var teacher = await _context.Teachers.FirstOrDefaultAsync(t => t.Id == teacherId.Value);
            if (teacher == null) return NotFound(new { message = "Teacher not found." });

            var year = DateTime.UtcNow.Year;
            var annualUsedDays = await _context.LeaveRequests
                .Where(r => r.TeacherId == teacher.Id && r.Status == "Approved" && r.StartDate.Year == year && r.LeaveType == "Annual")
                .SumAsync(r => (int?)r.Days) ?? 0;

            var medicalUsedDays = await _context.LeaveRequests
                .Where(r => r.TeacherId == teacher.Id && r.Status == "Approved" && r.StartDate.Year == year && r.LeaveType == "Medical")
                .SumAsync(r => (int?)r.Days) ?? 0;

            var dto = new LeaveBalanceDto
            {
                AnnualAllocation = teacher.AnnualLeaveDays,
                AnnualUsedDays = annualUsedDays,
                AnnualRemainingDays = Math.Max(teacher.AnnualLeaveDays - annualUsedDays, 0),
                MedicalAllocation = teacher.MedicalLeaveDays,
                MedicalUsedDays = medicalUsedDays,
                MedicalRemainingDays = Math.Max(teacher.MedicalLeaveDays - medicalUsedDays, 0)
            };

            return Ok(dto);
        }
    }
}
