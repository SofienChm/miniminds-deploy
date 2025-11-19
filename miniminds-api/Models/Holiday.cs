using System.ComponentModel.DataAnnotations;

namespace DaycareAPI.Models
{
    public class Holiday
    {
        public int Id { get; set; }
        
        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;
        
        [StringLength(500)]
        public string? Description { get; set; }
        
        [Required]
        public DateTime Date { get; set; }
        
        public bool IsRecurring { get; set; }
        
        [StringLength(50)]
        public string? RecurrenceType { get; set; }
        
        [Required]
        [StringLength(20)]
        public string Color { get; set; } = "#0d6efd";
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}
