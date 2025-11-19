using Microsoft.AspNetCore.Mvc;
using DaycareAPI.Models;
using DaycareAPI.DTOs;
using DaycareAPI.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace DaycareAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class TeachersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public TeachersController(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Teacher>>> GetTeachers([FromQuery] string? search = null)
        {
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            
            // Only Admin can see all teachers
            if (userRole != "Admin")
            {
                return Forbid();
            }
            
            var query = _context.Teachers.Where(t => t.IsActive).AsQueryable();
            
            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(t => 
                    t.FirstName.Contains(search) ||
                    t.LastName.Contains(search) ||
                    t.Email.Contains(search) ||
                    (t.Phone != null && t.Phone.Contains(search)) ||
                    (t.Specialization != null && t.Specialization.Contains(search)));
            }
            
            return await query
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Teacher>> GetTeacher(int id)
        {
            var teacher = await _context.Teachers.FindAsync(id);
            if (teacher == null)
                return NotFound();
            return teacher;
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<Teacher>> CreateTeacher([FromBody] CreateEducatorDto educatorDto)
        {
            Console.WriteLine($"Received CreateTeacher request for: {educatorDto.Email}");
            
            if (!ModelState.IsValid)
            {
                Console.WriteLine("ModelState is invalid:");
                foreach (var error in ModelState)
                {
                    Console.WriteLine($"{error.Key}: {string.Join(", ", error.Value.Errors.Select(e => e.ErrorMessage))}");
                }
                return BadRequest(ModelState);
            }

            // Check if user with this email already exists
            var existingUser = await _userManager.FindByEmailAsync(educatorDto.Email);
            if (existingUser != null)
            {
                Console.WriteLine($"User with email {educatorDto.Email} already exists");
                return BadRequest(new { message = "A user with this email already exists" });
            }

            // Create user account
            var user = new ApplicationUser
            {
                UserName = educatorDto.Email,
                Email = educatorDto.Email,
                FirstName = educatorDto.FirstName,
                LastName = educatorDto.LastName,
                ProfilePicture = educatorDto.ProfilePicture,
                CreatedAt = DateTime.UtcNow
            };

            Console.WriteLine($"Creating user account for: {user.Email}");
            var userResult = await _userManager.CreateAsync(user, educatorDto.Password);
            if (!userResult.Succeeded)
            {
                Console.WriteLine($"User creation failed: {string.Join(", ", userResult.Errors.Select(e => e.Description))}");
                return BadRequest(userResult.Errors);
            }
            Console.WriteLine($"User created successfully: {user.Id}");

            // Assign Teacher role
            Console.WriteLine($"Assigning Teacher role to user: {user.Id}");
            var roleResult = await _userManager.AddToRoleAsync(user, "Teacher");
            if (!roleResult.Succeeded)
            {
                Console.WriteLine($"Role assignment failed: {string.Join(", ", roleResult.Errors.Select(e => e.Description))}");
                // If role assignment fails, delete the user
                await _userManager.DeleteAsync(user);
                return BadRequest(roleResult.Errors);
            }
            Console.WriteLine($"Role assigned successfully");

            // Create teacher record
            var teacher = new Teacher
            {
                FirstName = educatorDto.FirstName,
                LastName = educatorDto.LastName,
                Email = educatorDto.Email,
                Phone = educatorDto.Phone,
                Address = educatorDto.Address,
                DateOfBirth = educatorDto.DateOfBirth,
                HireDate = educatorDto.HireDate,
                Specialization = educatorDto.Specialization,
                Salary = educatorDto.Salary,
                ProfilePicture = educatorDto.ProfilePicture,
                CreatedAt = DateTime.UtcNow
            };

            Console.WriteLine($"Creating teacher record for: {teacher.Email}");
            _context.Teachers.Add(teacher);
            await _context.SaveChangesAsync();
            Console.WriteLine($"Teacher record created successfully: {teacher.Id}");

            return CreatedAtAction(nameof(GetTeacher), new { id = teacher.Id }, teacher);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateTeacher(int id, Teacher teacher)
        {
            if (id != teacher.Id)
                return BadRequest();

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            teacher.UpdatedAt = DateTime.UtcNow;
            _context.Entry(teacher).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!TeacherExists(id))
                    return NotFound();
                throw;
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteTeacher(int id)
        {
            var teacher = await _context.Teachers.FindAsync(id);
            if (teacher == null)
                return NotFound();

            teacher.IsActive = false; // Soft delete
            teacher.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpGet("{id}/children")]
        public async Task<ActionResult<IEnumerable<Child>>> GetTeacherChildren(int id)
        {
            var teacher = await _context.Teachers.FindAsync(id);
            if (teacher == null)
                return NotFound();

            // Get children assigned to classes taught by this teacher
            var children = await _context.ClassEnrollments
                .Include(ce => ce.Child)
                .Include(ce => ce.Class)
                .Where(ce => ce.Class.TeacherId == id)
                .Select(ce => ce.Child)
                .Distinct()
                .ToListAsync();

            return Ok(children);
        }

        [HttpPost("{id}/assign-child")]
        [Authorize(Roles = "Admin,Teacher")]
        public async Task<IActionResult> AssignChildToTeacher(int id, [FromBody] AssignChildRequest request)
        {
            var teacher = await _context.Teachers.FindAsync(id);
            if (teacher == null)
                return NotFound("Teacher not found");

            var child = await _context.Children.FindAsync(request.ChildId);
            if (child == null)
                return NotFound("Child not found");

            // Find a class taught by this teacher with available capacity
            var teacherClass = await _context.Classes
                .Where(c => c.TeacherId == id && c.IsActive)
                .FirstOrDefaultAsync();

            if (teacherClass == null)
                return BadRequest("Teacher has no active classes");

            // Check if child is already enrolled in this class
            var existingEnrollment = await _context.ClassEnrollments
                .FirstOrDefaultAsync(ce => ce.ClassId == teacherClass.Id && ce.ChildId == request.ChildId);

            if (existingEnrollment != null)
                return BadRequest("Child is already assigned to this teacher's class");

            // Create new enrollment
            var enrollment = new ClassEnrollment
            {
                ClassId = teacherClass.Id,
                ChildId = request.ChildId,
                EnrolledAt = DateTime.UtcNow
            };

            _context.ClassEnrollments.Add(enrollment);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Child assigned successfully" });
        }

        [HttpDelete("{id}/remove-child/{childId}")]
        [Authorize(Roles = "Admin,Teacher")]
        public async Task<IActionResult> RemoveChildFromTeacher(int id, int childId)
        {
            var teacher = await _context.Teachers.FindAsync(id);
            if (teacher == null)
                return NotFound("Teacher not found");

            // Find enrollment in teacher's classes
            var enrollment = await _context.ClassEnrollments
                .Include(ce => ce.Class)
                .FirstOrDefaultAsync(ce => ce.Class.TeacherId == id && ce.ChildId == childId);

            if (enrollment == null)
                return NotFound("Child is not assigned to this teacher");

            _context.ClassEnrollments.Remove(enrollment);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Child removed successfully" });
        }

        private bool TeacherExists(int id)
        {
            return _context.Teachers.Any(e => e.Id == id);
        }
    }

    public class AssignChildRequest
    {
        public int ChildId { get; set; }
    }
}