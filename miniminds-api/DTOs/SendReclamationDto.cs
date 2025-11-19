namespace DaycareAPI.DTOs
{
    public class SendReclamationDto
    {
        public string RecipientId { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
    }
}