using System.ComponentModel.DataAnnotations;

namespace DaycareAPI.Models
{
    public class Reclamation
    {
        public int Id { get; set; }
        
        [Required]
        public string SenderId { get; set; } = string.Empty;
        
        [Required]
        public string RecipientId { get; set; } = string.Empty;
        
        [Required]
        public string Subject { get; set; } = string.Empty;
        
        [Required]
        public string Content { get; set; } = string.Empty;
        
        public string? Response { get; set; }
        
        public bool IsResolved { get; set; } = false;
        
        public DateTime SentAt { get; set; } = DateTime.UtcNow;
        
        public DateTime? ResolvedAt { get; set; }
        
        // Navigation properties
        public ApplicationUser? Sender { get; set; }
        public ApplicationUser? Recipient { get; set; }
    }
}