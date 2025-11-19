using System.ComponentModel.DataAnnotations;

namespace DaycareAPI.Models
{
    public class Message
    {
        public int Id { get; set; }
        
        [Required]
        public string SenderId { get; set; } = string.Empty;
        
        public string? RecipientId { get; set; }
        
        public string Subject { get; set; } = "No Subject";
        
        [Required]
        public string Content { get; set; } = string.Empty;
        
        public DateTime SentAt { get; set; } = DateTime.UtcNow;
        
        public bool IsRead { get; set; } = false;
        
        public int? ParentMessageId { get; set; }
        
        public string RecipientType { get; set; } = "individual";
        
        // Navigation properties
        public ApplicationUser? Sender { get; set; }
        public ApplicationUser? Recipient { get; set; }
        public Message? ParentMessage { get; set; }
        public ICollection<Message> Replies { get; set; } = new List<Message>();
    }
}