using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DaycareAPI.Models
{
    public class Class
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Description { get; set; }

        public int? TeacherId { get; set; }

        [Required]
        public int Capacity { get; set; }

        [Required]
        public int AgeGroupMin { get; set; }

        [Required]
        public int AgeGroupMax { get; set; }

        [StringLength(200)]
        public string? Schedule { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        [ForeignKey("TeacherId")]
        public Teacher? Teacher { get; set; }
    }
}
