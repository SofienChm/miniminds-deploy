using System.ComponentModel.DataAnnotations;

namespace DaycareAPI.Models
{
    public class Fee
    {
        public int Id { get; set; }
        
        [Required]
        public int ChildId { get; set; }
        public Child? Child { get; set; }
        
        [Required]
        public decimal Amount { get; set; }
        
        [Required]
        [StringLength(500)]
        public string Description { get; set; } = string.Empty;
        
        [Required]
        public DateTime DueDate { get; set; }
        
        public DateTime? PaidDate { get; set; }
        
        [Required]
        [StringLength(20)]
        public string Status { get; set; } = "pending";
        
        [Required]
        [StringLength(20)]
        public string FeeType { get; set; } = "monthly";
        
        [StringLength(1000)]
        public string? Notes { get; set; }
        
        [StringLength(1000)]
        public string? PaymentNotes { get; set; }
        
        [StringLength(255)]
        public string? StripePaymentIntentId { get; set; }
        
        [StringLength(50)]
        public string? PaymentMethod { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}
