using System.ComponentModel.DataAnnotations;

namespace DaycareAPI.Models
{
    public class Parent
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string FirstName { get; set; } = string.Empty;

        [Required]
        [StringLength(100)]
        public string LastName { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [StringLength(255)]
        public string Email { get; set; } = string.Empty;

        [Required]
        [Phone]
        [StringLength(20)]
        public string PhoneNumber { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Address { get; set; }

        [StringLength(20)]
        public string? EmergencyContact { get; set; }

        public string? ProfilePicture { get; set; }

        [StringLength(10)]
        public string? Gender { get; set; }

        public DateTime? DateOfBirth { get; set; }

        [StringLength(200)]
        public string? Work { get; set; }

        [StringLength(20)]
        public string? ZipCode { get; set; }

        [StringLength(50)]
        public string? ParentType { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public ICollection<Child> Children { get; set; } = new List<Child>();
        public ICollection<ChildParent> ChildParents { get; set; } = new List<ChildParent>();
    }
}