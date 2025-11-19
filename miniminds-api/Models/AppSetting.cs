using System.ComponentModel.DataAnnotations;

namespace DaycareAPI.Models
{
    public class AppSetting
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Key { get; set; } = string.Empty;

        [Required]
        public string Value { get; set; } = string.Empty;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
