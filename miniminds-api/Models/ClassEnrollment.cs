using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DaycareAPI.Models
{
    public class ClassEnrollment
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int ClassId { get; set; }

        [Required]
        public int ChildId { get; set; }

        public DateTime EnrolledAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("ClassId")]
        public Class? Class { get; set; }

        [ForeignKey("ChildId")]
        public Child? Child { get; set; }
    }
}
