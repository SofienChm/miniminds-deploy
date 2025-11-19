using DaycareAPI.Data;
using DaycareAPI.Models;
using DaycareAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Stripe;
using Stripe.Checkout;

namespace DaycareAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class PaymentController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly NotificationService _notificationService;

        public PaymentController(ApplicationDbContext context, IConfiguration configuration, NotificationService notificationService)
        {
            _context = context;
            _configuration = configuration;
            _notificationService = notificationService;
            StripeConfiguration.ApiKey = _configuration["Stripe:SecretKey"];
        }

        [HttpPost("create-checkout-session/{feeId}")]
        public async Task<ActionResult> CreateCheckoutSession(int feeId)
        {
            var fee = await _context.Fees
                .Include(f => f.Child)
                .ThenInclude(c => c.Parent)
                .FirstOrDefaultAsync(f => f.Id == feeId);

            if (fee == null)
                return NotFound();

            if (fee.Status == "paid")
                return BadRequest(new { message = "Fee already paid" });

            var options = new SessionCreateOptions
            {
                PaymentMethodTypes = new List<string> { "card" },
                LineItems = new List<SessionLineItemOptions>
                {
                    new SessionLineItemOptions
                    {
                        PriceData = new SessionLineItemPriceDataOptions
                        {
                            Currency = "usd",
                            ProductData = new SessionLineItemPriceDataProductDataOptions
                            {
                                Name = $"Fee for {fee.Child?.FirstName} {fee.Child?.LastName}",
                                Description = fee.Description
                            },
                            UnitAmount = (long)(fee.Amount * 100)
                        },
                        Quantity = 1
                    }
                },
                Mode = "payment",
                SuccessUrl = $"{Request.Headers["Origin"]}/fees/detail/{feeId}?payment=success",
                CancelUrl = $"{Request.Headers["Origin"]}/fees/detail/{feeId}?payment=cancelled",
                Metadata = new Dictionary<string, string>
                {
                    { "feeId", feeId.ToString() }
                }
            };

            var service = new SessionService();
            var session = await service.CreateAsync(options);

            return Ok(new { sessionId = session.Id, url = session.Url });
        }

        [HttpPost("webhook")]
        [AllowAnonymous]
        public async Task<IActionResult> StripeWebhook()
        {
            var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync();
            var stripeSignature = Request.Headers["Stripe-Signature"];

            try
            {
                var stripeEvent = EventUtility.ConstructEvent(
                    json,
                    stripeSignature,
                    _configuration["Stripe:WebhookSecret"]
                );

                if (stripeEvent.Type == "checkout.session.completed")
                {
                    var session = stripeEvent.Data.Object as Session;
                    if (session?.Metadata != null && session.Metadata.ContainsKey("feeId"))
                    {
                        var feeId = int.Parse(session.Metadata["feeId"]);
                        var fee = await _context.Fees
                            .Include(f => f.Child)
                            .ThenInclude(c => c.Parent)
                            .FirstOrDefaultAsync(f => f.Id == feeId);

                        if (fee != null && fee.Status != "paid")
                        {
                            fee.Status = "paid";
                            fee.PaidDate = DateTime.UtcNow;
                            fee.StripePaymentIntentId = session.PaymentIntentId;
                            fee.PaymentMethod = "stripe";
                            fee.UpdatedAt = DateTime.UtcNow;

                            await _context.SaveChangesAsync();

                            // Send notification to admins
                            var adminRoleId = await _context.Roles.Where(r => r.Name == "Admin").Select(r => r.Id).FirstOrDefaultAsync();
                            if (adminRoleId != null)
                            {
                                var adminUserIds = await _context.UserRoles.Where(ur => ur.RoleId == adminRoleId).Select(ur => ur.UserId).ToListAsync();
                                foreach (var adminId in adminUserIds)
                                {
                                    await _notificationService.SendNotificationAsync(
                                        adminId,
                                        "Fee Payment Received",
                                        $"{fee.Child?.Parent?.FirstName} {fee.Child?.Parent?.LastName} paid ${fee.Amount} for {fee.Child?.FirstName} {fee.Child?.LastName}",
                                        "FeePayment",
                                        $"/fees/detail/{fee.Id}"
                                    );
                                }
                            }
                        }
                    }
                }

                return Ok();
            }
            catch (StripeException)
            {
                return BadRequest();
            }
        }
    }
}
