using DaycareAPI.Data;
using DaycareAPI.Models;
using DaycareAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace DaycareAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class FeesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly INotificationService _notificationService;

        public FeesController(ApplicationDbContext context, INotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetFees()
        {
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            
            IQueryable<Fee> query = _context.Fees
                .Include(f => f.Child)
                    .ThenInclude(c => c.Parent);
            
            if (userRole == "Parent")
            {
                var parentIdClaim = User.FindFirst("ParentId")?.Value;
                if (int.TryParse(parentIdClaim, out int parentId))
                {
                    query = query.Where(f => f.Child.ParentId == parentId);
                }
                else
                {
                    return Forbid();
                }
            }
            
            var fees = await query.OrderByDescending(f => f.CreatedAt).ToListAsync();

            var result = fees.Select(f => new
            {
                f.Id,
                f.ChildId,
                ChildName = f.Child != null ? f.Child.FirstName + " " + f.Child.LastName : "",
                ParentName = f.Child != null && f.Child.Parent != null ? f.Child.Parent.FirstName + " " + f.Child.Parent.LastName : "",
                ParentEmail = f.Child != null && f.Child.Parent != null ? f.Child.Parent.Email : "",
                f.Amount,
                f.Description,
                f.DueDate,
                f.PaidDate,
                f.Status,
                f.FeeType,
                f.Notes,
                f.PaymentNotes,
                DaysOverdue = f.Status == "overdue" ? (int)(DateTime.UtcNow - f.DueDate).TotalDays : 0,
                f.CreatedAt
            });

            return Ok(result);
        }

        [HttpGet("summary")]
        public async Task<ActionResult<object>> GetFeesSummary()
        {
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            
            IQueryable<Fee> query = _context.Fees.Include(f => f.Child);
            
            if (userRole == "Parent")
            {
                var parentIdClaim = User.FindFirst("ParentId")?.Value;
                if (int.TryParse(parentIdClaim, out int parentId))
                {
                    query = query.Where(f => f.Child.ParentId == parentId);
                }
                else
                {
                    return Forbid();
                }
            }
            
            var fees = await query.ToListAsync();

            var summary = new
            {
                TotalFees = fees.Count,
                PaidFees = fees.Count(f => f.Status == "paid"),
                PendingFees = fees.Count(f => f.Status == "pending"),
                OverdueFees = fees.Count(f => f.Status == "overdue"),
                TotalAmount = fees.Sum(f => f.Amount),
                PaidAmount = fees.Where(f => f.Status == "paid").Sum(f => f.Amount),
                PendingAmount = fees.Where(f => f.Status == "pending").Sum(f => f.Amount),
                OverdueAmount = fees.Where(f => f.Status == "overdue").Sum(f => f.Amount)
            };

            return Ok(summary);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Fee>> GetFee(int id)
        {
            var fee = await _context.Fees
                .Include(f => f.Child)
                    .ThenInclude(c => c.Parent)
                .FirstOrDefaultAsync(f => f.Id == id);

            if (fee == null)
                return NotFound();
                
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            if (userRole == "Parent")
            {
                var parentIdClaim = User.FindFirst("ParentId")?.Value;
                if (int.TryParse(parentIdClaim, out int parentId) && fee.Child.ParentId != parentId)
                {
                    return Forbid();
                }
            }

            return Ok(fee);
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Teacher")]
        public async Task<ActionResult<Fee>> CreateFee(Fee fee)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            fee.CreatedAt = DateTime.UtcNow;
            _context.Fees.Add(fee);
            await _context.SaveChangesAsync();

            // Send notification to parent
            try
            {
                var child = await _context.Children.Include(c => c.Parent).FirstOrDefaultAsync(c => c.Id == fee.ChildId);
                Console.WriteLine($"Child found: {child?.FirstName}, Parent: {child?.Parent?.Email}");
                
                if (child?.Parent != null)
                {
                    var parentUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == child.Parent.Email);
                    Console.WriteLine($"Parent user found: {parentUser?.Email}, UserId: {parentUser?.Id}");
                    
                    if (parentUser != null)
                    {
                        await _notificationService.SendNotificationAsync(
                            parentUser.Id,
                            "New Fee Added",
                            $"A new fee of ${fee.Amount} has been added for {child.FirstName}. Due date: {fee.DueDate:MMM dd, yyyy}",
                            "Fee",
                            $"/fees/detail/{fee.Id}"
                        );
                        Console.WriteLine($"Notification sent to parent {parentUser.Email}");
                    }
                    else
                    {
                        Console.WriteLine($"Parent user not found for email: {child.Parent.Email}");
                    }
                }
                else
                {
                    Console.WriteLine($"Child or Parent is null");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error sending notification: {ex.Message}");
            }

            return CreatedAtAction(nameof(GetFee), new { id = fee.Id }, fee);
        }

        [HttpPost("bulk-monthly")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<object>> CreateMonthlyFeesForAll([FromBody] BulkFeeRequest request)
        {
            var children = await _context.Children.ToListAsync();
            var count = 0;

            foreach (var child in children)
            {
                var fee = new Fee
                {
                    ChildId = child.Id,
                    Amount = request.Amount,
                    Description = request.Description,
                    DueDate = DateTime.Parse(request.DueDate),
                    Status = "pending",
                    FeeType = "monthly",
                    CreatedAt = DateTime.UtcNow
                };

                _context.Fees.Add(fee);
                count++;
            }

            await _context.SaveChangesAsync();

            return Ok(new { Count = count });
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Teacher")]
        public async Task<IActionResult> UpdateFee(int id, Fee fee)
        {
            if (id != fee.Id)
                return BadRequest();

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            fee.UpdatedAt = DateTime.UtcNow;
            _context.Entry(fee).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!FeeExists(id))
                    return NotFound();
                throw;
            }

            return NoContent();
        }

        [HttpPut("{id}/pay")]
        public async Task<IActionResult> PayFee(int id, [FromBody] PayFeeRequest request)
        {
            var fee = await _context.Fees
                .Include(f => f.Child)
                    .ThenInclude(c => c.Parent)
                .FirstOrDefaultAsync(f => f.Id == id);
                
            if (fee == null)
                return NotFound();

            fee.Status = "paid";
            fee.PaidDate = string.IsNullOrEmpty(request.PaidDate) ? DateTime.UtcNow : DateTime.Parse(request.PaidDate);
            fee.PaymentNotes = request.PaymentNotes;
            fee.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Notify all admin users
            var adminUsers = await _context.Users
                .Join(_context.UserRoles, u => u.Id, ur => ur.UserId, (u, ur) => new { User = u, ur.RoleId })
                .Join(_context.Roles, x => x.RoleId, r => r.Id, (x, r) => new { x.User, Role = r })
                .Where(x => x.Role.Name == "Admin")
                .Select(x => x.User)
                .ToListAsync();

            foreach (var admin in adminUsers)
            {
                await _notificationService.SendNotificationAsync(
                    admin.Id,
                    "Fee Payment Received",
                    $"{fee.Child.Parent?.FirstName} {fee.Child.Parent?.LastName} paid ${fee.Amount} for {fee.Child.FirstName}. Payment date: {fee.PaidDate:MMM dd, yyyy}",
                    "Fee",
                    $"/fees/detail/{fee.Id}"
                );
            }

            return NoContent();
        }

        [HttpPut("update-overdue")]
        [Authorize(Roles = "Admin,Teacher")]
        public async Task<ActionResult<object>> UpdateOverdueFees()
        {
            var fees = await _context.Fees
                .Where(f => f.Status == "pending" && f.DueDate < DateTime.UtcNow)
                .ToListAsync();

            foreach (var fee in fees)
            {
                fee.Status = "overdue";
                fee.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            return Ok(new { Count = fees.Count });
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteFee(int id)
        {
            var fee = await _context.Fees.FindAsync(id);
            if (fee == null)
                return NotFound();

            _context.Fees.Remove(fee);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool FeeExists(int id)
        {
            return _context.Fees.Any(e => e.Id == id);
        }
    }

    public class BulkFeeRequest
    {
        public decimal Amount { get; set; }
        public string Description { get; set; } = string.Empty;
        public string DueDate { get; set; } = string.Empty;
    }

    public class PayFeeRequest
    {
        public string? PaidDate { get; set; }
        public string? PaymentNotes { get; set; }
    }
}
