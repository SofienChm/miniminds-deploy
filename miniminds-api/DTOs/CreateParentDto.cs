using System.ComponentModel.DataAnnotations;

namespace DaycareAPI.DTOs
{
    public class CreateParentDto
    {
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

        [Required]
        [StringLength(100, MinimumLength = 6)]
        public string Password { get; set; } = string.Empty;
    }
}