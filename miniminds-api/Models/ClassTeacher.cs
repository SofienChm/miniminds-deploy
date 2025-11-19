using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DaycareAPI.Models
{
    public class ClassTeacher
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int ClassId { get; set; }

        [Required]
        public int TeacherId { get; set; }

        public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("ClassId")]
        public Class? Class { get; set; }

        [ForeignKey("TeacherId")]
        public Teacher? Teacher { get; set; }
    }
}
