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
    public class ClassesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ClassesController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Classes
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetClasses()
        {
            var classes = await _context.Classes
                .Include(c => c.Teacher)
                .OrderBy(c => c.Name)
                .ToListAsync();

            var result = classes.Select(c => new
            {
                c.Id,
                c.Name,
                c.Description,
                c.TeacherId,
                c.Capacity,
                c.AgeGroupMin,
                c.AgeGroupMax,
                c.Schedule,
                c.IsActive,
                c.CreatedAt,
                c.UpdatedAt,
                c.Teacher,
                EnrollmentCount = _context.ClassEnrollments.Count(ce => ce.ClassId == c.Id)
            });

            return Ok(result);
        }

        // GET: api/Classes/5
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetClass(int id)
        {
            var classItem = await _context.Classes
                .Include(c => c.Teacher)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (classItem == null)
                return NotFound();

            var enrollmentCount = await _context.ClassEnrollments.CountAsync(ce => ce.ClassId == id);

            var result = new
            {
                classItem.Id,
                classItem.Name,
                classItem.Description,
                classItem.TeacherId,
                classItem.Capacity,
                classItem.AgeGroupMin,
                classItem.AgeGroupMax,
                classItem.Schedule,
                classItem.IsActive,
                classItem.CreatedAt,
                classItem.UpdatedAt,
                classItem.Teacher,
                EnrollmentCount = enrollmentCount
            };

            return Ok(result);
        }

        // POST: api/Classes
        [HttpPost]
        [Authorize(Roles = "Admin,Teacher")]
        public async Task<ActionResult<Class>> CreateClass(Class classItem)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            classItem.CreatedAt = DateTime.UtcNow;
            _context.Classes.Add(classItem);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetClass), new { id = classItem.Id }, classItem);
        }

        // PUT: api/Classes/5
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Teacher")]
        public async Task<IActionResult> UpdateClass(int id, Class classItem)
        {
            if (id != classItem.Id)
                return BadRequest();

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            classItem.UpdatedAt = DateTime.UtcNow;
            _context.Entry(classItem).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ClassExists(id))
                    return NotFound();
                throw;
            }

            return NoContent();
        }

        // DELETE: api/Classes/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteClass(int id)
        {
            var classItem = await _context.Classes.FindAsync(id);
            if (classItem == null)
                return NotFound();

            _context.Classes.Remove(classItem);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool ClassExists(int id)
        {
            return _context.Classes.Any(c => c.Id == id);
        }

        // GET: api/Classes/5/children
        [HttpGet("{id}/children")]
        public async Task<ActionResult<IEnumerable<Child>>> GetClassChildren(int id)
        {
            var children = await _context.ClassEnrollments
                .Where(ce => ce.ClassId == id)
                .Include(ce => ce.Child)
                .Select(ce => ce.Child)
                .ToListAsync();

            return Ok(children);
        }

        // POST: api/Classes/enroll
        [HttpPost("enroll")]
        [Authorize(Roles = "Admin,Teacher")]
        public async Task<IActionResult> EnrollChild([FromBody] EnrollRequest request)
        {
            var enrollment = new ClassEnrollment
            {
                ClassId = request.ClassId,
                ChildId = request.ChildId,
                EnrolledAt = DateTime.UtcNow
            };

            _context.ClassEnrollments.Add(enrollment);
            await _context.SaveChangesAsync();

            return Ok();
        }

        // DELETE: api/Classes/5/children/10
        [HttpDelete("{classId}/children/{childId}")]
        [Authorize(Roles = "Admin,Teacher")]
        public async Task<IActionResult> RemoveChildFromClass(int classId, int childId)
        {
            var enrollment = await _context.ClassEnrollments
                .FirstOrDefaultAsync(ce => ce.ClassId == classId && ce.ChildId == childId);

            if (enrollment == null)
                return NotFound();

            _context.ClassEnrollments.Remove(enrollment);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // GET: api/Classes/5/teachers
        [HttpGet("{id}/teachers")]
        public async Task<ActionResult<IEnumerable<Teacher>>> GetClassTeachers(int id)
        {
            var teachers = await _context.ClassTeachers
                .Where(ct => ct.ClassId == id)
                .Include(ct => ct.Teacher)
                .Select(ct => ct.Teacher)
                .ToListAsync();

            return Ok(teachers);
        }

        // POST: api/Classes/assign-teachers
        [HttpPost("assign-teachers")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AssignTeachers([FromBody] AssignTeachersRequest request)
        {
            foreach (var teacherId in request.TeacherIds)
            {
                var exists = await _context.ClassTeachers
                    .AnyAsync(ct => ct.ClassId == request.ClassId && ct.TeacherId == teacherId);

                if (!exists)
                {
                    var classTeacher = new ClassTeacher
                    {
                        ClassId = request.ClassId,
                        TeacherId = teacherId,
                        AssignedAt = DateTime.UtcNow
                    };
                    _context.ClassTeachers.Add(classTeacher);
                }
            }

            await _context.SaveChangesAsync();
            return Ok();
        }

        // DELETE: api/Classes/5/teachers/10
        [HttpDelete("{classId}/teachers/{teacherId}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> RemoveTeacherFromClass(int classId, int teacherId)
        {
            var classTeacher = await _context.ClassTeachers
                .FirstOrDefaultAsync(ct => ct.ClassId == classId && ct.TeacherId == teacherId);

            if (classTeacher == null)
                return NotFound();

            _context.ClassTeachers.Remove(classTeacher);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }

    public class EnrollRequest
    {
        public int ClassId { get; set; }
        public int ChildId { get; set; }
    }

    public class AssignTeachersRequest
    {
        public int ClassId { get; set; }
        public List<int> TeacherIds { get; set; } = new List<int>();
    }
}
