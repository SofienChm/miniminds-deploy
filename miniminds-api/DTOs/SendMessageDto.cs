namespace DaycareAPI.DTOs
{
    public class SendMessageDto
    {
        public string? RecipientId { get; set; }
        public string Subject { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string RecipientType { get; set; } = "individual";
        public int? ParentMessageId { get; set; }
    }
}