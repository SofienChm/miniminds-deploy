using DaycareAPI.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace DaycareAPI.Data
{
    public static class DatabaseSeeder
    {
        public static async Task SeedAsync(ApplicationDbContext context, UserManager<ApplicationUser> userManager, RoleManager<IdentityRole> roleManager)
        {
            await SeedRoles(roleManager);
            await SeedUsers(userManager);
            await SeedParents(context);
            await SeedTeachers(context);
            await SeedChildren(context);
            await SeedPrograms(context);
            await SeedClasses(context);
            await SeedProgramEnrollments(context);
            await SeedAttendance(context);
            await SeedDailyActivities(context);
            await SeedEvents(context);
            await SeedEventParticipants(context);
            await SeedFees(context);
            await SeedMessages(context);
            await SeedReclamations(context);
            await SeedNotifications(context);
            await SeedHolidays(context);
            await SeedAppSettings(context);
            await context.SaveChangesAsync();
        }

        private static async Task SeedRoles(RoleManager<IdentityRole> roleManager)
        {
            string[] roles = { "Admin", "Parent", "Teacher" };
            foreach (string role in roles)
            {
                if (!await roleManager.RoleExistsAsync(role))
                {
                    await roleManager.CreateAsync(new IdentityRole(role));
                }
            }
        }

        private static async Task SeedUsers(UserManager<ApplicationUser> userManager)
        {
            var users = new[]
            {
                new { Email = "admin@daycare.com", FirstName = "Admin", LastName = "User", Role = "Admin" },
                new { Email = "teacher1@daycare.com", FirstName = "Sarah", LastName = "Johnson", Role = "Teacher" },
                new { Email = "teacher2@daycare.com", FirstName = "Mike", LastName = "Wilson", Role = "Teacher" },
                new { Email = "parent1@daycare.com", FirstName = "John", LastName = "Smith", Role = "Parent" },
                new { Email = "parent2@daycare.com", FirstName = "Emma", LastName = "Davis", Role = "Parent" },
                new { Email = "parent3@daycare.com", FirstName = "Robert", LastName = "Brown", Role = "Parent" }
            };

            foreach (var userData in users)
            {
                var user = await userManager.FindByEmailAsync(userData.Email);
                if (user == null)
                {
                    user = new ApplicationUser
                    {
                        UserName = userData.Email,
                        Email = userData.Email,
                        FirstName = userData.FirstName,
                        LastName = userData.LastName,
                        EmailConfirmed = true
                    };
                    await userManager.CreateAsync(user, "Password@123");
                    await userManager.AddToRoleAsync(user, userData.Role);
                }
            }
        }

        private static async Task SeedParents(ApplicationDbContext context)
        {
            if (!context.Parents.Any())
            {
                var parents = new List<Parent>
                {
                    new Parent { FirstName = "John", LastName = "Smith", Email = "parent1@daycare.com", PhoneNumber = "555-0101", Address = "123 Main St", ParentType = "Primary" },
                    new Parent { FirstName = "Emma", LastName = "Davis", Email = "parent2@daycare.com", PhoneNumber = "555-0102", Address = "456 Oak Ave", ParentType = "Primary" },
                    new Parent { FirstName = "Robert", LastName = "Brown", Email = "parent3@daycare.com", PhoneNumber = "555-0103", Address = "789 Pine Rd", ParentType = "Secondary" }
                };
                context.Parents.AddRange(parents);
                await context.SaveChangesAsync();
            }
        }

        private static async Task SeedTeachers(ApplicationDbContext context)
        {
            if (!context.Teachers.Any())
            {
                var teachers = new List<Teacher>
                {
                    new Teacher { FirstName = "Sarah", LastName = "Johnson", Email = "teacher1@daycare.com", Specialization = "Early Childhood" },
                    new Teacher { FirstName = "Mike", LastName = "Wilson", Email = "teacher2@daycare.com", Specialization = "Physical Education" }
                };
                context.Teachers.AddRange(teachers);
                await context.SaveChangesAsync();
            }
        }

        private static async Task SeedChildren(ApplicationDbContext context)
        {
            if (!context.Children.Any())
            {
                var children = new List<Child>
                {
                    new Child { FirstName = "Alice", LastName = "Smith", DateOfBirth = DateTime.Now.AddYears(-3), Gender = "Female", ParentId = 1, Allergies = "Peanuts" },
                    new Child { FirstName = "Bob", LastName = "Smith", DateOfBirth = DateTime.Now.AddYears(-4), Gender = "Male", ParentId = 1 },
                    new Child { FirstName = "Charlie", LastName = "Davis", DateOfBirth = DateTime.Now.AddYears(-2), Gender = "Male", ParentId = 2 },
                    new Child { FirstName = "Diana", LastName = "Brown", DateOfBirth = DateTime.Now.AddYears(-5), Gender = "Female", ParentId = 3, MedicalNotes = "Asthma" }
                };
                context.Children.AddRange(children);
                await context.SaveChangesAsync();
            }
        }

        private static async Task SeedPrograms(ApplicationDbContext context)
        {
            if (!context.DaycarePrograms.Any())
            {
                var programs = new List<DaycareProgram>
                {
                    new DaycareProgram { Title = "Toddler Program", Description = "Ages 1-2", Capacity = 15, MinAge = 1, MaxAge = 2, Date = DateTime.Today, StartTime = TimeSpan.FromHours(8), EndTime = TimeSpan.FromHours(17) },
                    new DaycareProgram { Title = "Preschool Program", Description = "Ages 3-4", Capacity = 20, MinAge = 3, MaxAge = 4, Date = DateTime.Today, StartTime = TimeSpan.FromHours(8), EndTime = TimeSpan.FromHours(17) },
                    new DaycareProgram { Title = "Pre-K Program", Description = "Ages 4-5", Capacity = 18, MinAge = 4, MaxAge = 5, Date = DateTime.Today, StartTime = TimeSpan.FromHours(8), EndTime = TimeSpan.FromHours(15) }
                };
                context.DaycarePrograms.AddRange(programs);
                await context.SaveChangesAsync();
            }
        }

        private static async Task SeedClasses(ApplicationDbContext context)
        {
            if (!context.Classes.Any())
            {
                var classes = new List<Class>
                {
                    new Class { Name = "Toddlers A", Description = "Morning toddler class", Capacity = 10 },
                    new Class { Name = "Preschool B", Description = "Afternoon preschool class", Capacity = 15 }
                };
                context.Classes.AddRange(classes);
                await context.SaveChangesAsync();
            }
        }

        private static async Task SeedProgramEnrollments(ApplicationDbContext context)
        {
            if (!context.ProgramEnrollments.Any())
            {
                var enrollments = new List<ProgramEnrollment>
                {
                    new ProgramEnrollment { ProgramId = 1, ChildId = 1 },
                    new ProgramEnrollment { ProgramId = 2, ChildId = 2 },
                    new ProgramEnrollment { ProgramId = 1, ChildId = 3 }
                };
                context.ProgramEnrollments.AddRange(enrollments);
                await context.SaveChangesAsync();
            }
        }

        private static async Task SeedAttendance(ApplicationDbContext context)
        {
            if (!context.Attendances.Any())
            {
                var attendances = new List<Attendance>
                {
                    new Attendance { ChildId = 1, Date = DateTime.Today, CheckInTime = DateTime.Today.AddHours(8), CheckOutTime = DateTime.Today.AddHours(16) },
                    new Attendance { ChildId = 2, Date = DateTime.Today, CheckInTime = DateTime.Today.AddHours(9), CheckOutTime = DateTime.Today.AddHours(17) },
                    new Attendance { ChildId = 3, Date = DateTime.Today, CheckInTime = DateTime.Today.AddHours(8), CheckOutTime = null }
                };
                context.Attendances.AddRange(attendances);
                await context.SaveChangesAsync();
            }
        }

        private static async Task SeedDailyActivities(ApplicationDbContext context)
        {
            if (!context.DailyActivities.Any())
            {
                var activities = new List<DailyActivity>
                {
                    new DailyActivity { ChildId = 1, ActivityType = "Play", ActivityTime = DateTime.Now.AddHours(-2), Duration = TimeSpan.FromMinutes(30), Notes = "Building blocks", Mood = "Happy" },
                    new DailyActivity { ChildId = 2, ActivityType = "Nap", ActivityTime = DateTime.Now.AddHours(-1), Duration = TimeSpan.FromMinutes(60), Mood = "Sleepy" },
                    new DailyActivity { ChildId = 1, ActivityType = "Eat", ActivityTime = DateTime.Now.AddHours(-3), FoodItem = "Sandwich", Mood = "Happy" }
                };
                context.DailyActivities.AddRange(activities);
                await context.SaveChangesAsync();
            }
        }

        private static async Task SeedEvents(ApplicationDbContext context)
        {
            if (!context.Events.Any())
            {
                var events = new List<Event>
                {
                    new Event { Name = "Spring Festival", Type = "Festival", Description = "Annual spring celebration", Price = 25.00m, AgeFrom = 2, AgeTo = 6, Capacity = 50, Time = "10:00 AM - 2:00 PM", Place = "Main Hall" },
                    new Event { Name = "Parent Meeting", Type = "Meeting", Description = "Monthly parent-teacher meeting", Price = 0.00m, AgeFrom = 0, AgeTo = 10, Capacity = 30, Time = "6:00 PM - 8:00 PM", Place = "Conference Room" },
                    new Event { Name = "Sports Day", Type = "Sports", Description = "Annual sports competition", Price = 15.00m, AgeFrom = 3, AgeTo = 6, Capacity = 40, Time = "9:00 AM - 12:00 PM", Place = "Playground" }
                };
                context.Events.AddRange(events);
                await context.SaveChangesAsync();
            }
        }

        private static async Task SeedEventParticipants(ApplicationDbContext context)
        {
            if (!context.EventParticipants.Any())
            {
                var participants = new List<EventParticipant>
                {
                    new EventParticipant { EventId = 1, ChildId = 1, Status = "Registered" },
                    new EventParticipant { EventId = 1, ChildId = 2, Status = "Registered" },
                    new EventParticipant { EventId = 3, ChildId = 2, Status = "Confirmed" }
                };
                context.EventParticipants.AddRange(participants);
                await context.SaveChangesAsync();
            }
        }

        private static async Task SeedFees(ApplicationDbContext context)
        {
            if (!context.Fees.Any())
            {
                var fees = new List<Fee>
                {
                    new Fee { ChildId = 1, Amount = 800.00m, DueDate = DateTime.Now.AddDays(30), Status = "Pending", Description = "Monthly tuition - January" },
                    new Fee { ChildId = 2, Amount = 750.00m, DueDate = DateTime.Now.AddDays(15), Status = "Paid", Description = "Monthly tuition - January" },
                    new Fee { ChildId = 3, Amount = 800.00m, DueDate = DateTime.Now.AddDays(-5), Status = "Overdue", Description = "Monthly tuition - December" }
                };
                context.Fees.AddRange(fees);
                await context.SaveChangesAsync();
            }
        }

        private static async Task SeedMessages(ApplicationDbContext context)
        {
            if (!context.Messages.Any())
            {
                var adminUser = context.Users.FirstOrDefault(u => u.Email == "admin@daycare.com");
                var teacherUser = context.Users.FirstOrDefault(u => u.Email == "teacher1@daycare.com");
                var parentUser = context.Users.FirstOrDefault(u => u.Email == "parent1@daycare.com");
                
                if (adminUser != null && parentUser != null && teacherUser != null)
                {
                    var messages = new List<Message>
                    {
                        new Message { SenderId = adminUser.Id, RecipientId = parentUser.Id, Subject = "Welcome", Content = "Welcome to our daycare!", RecipientType = "Parent", SentAt = DateTime.Now.AddDays(-5), IsRead = true },
                        new Message { SenderId = teacherUser.Id, RecipientId = parentUser.Id, Subject = "Daily Update", Content = "Your child had a great day!", RecipientType = "Parent", SentAt = DateTime.Now.AddDays(-1), IsRead = false },
                        new Message { SenderId = parentUser.Id, RecipientId = adminUser.Id, Subject = "Question", Content = "What time does pickup start?", RecipientType = "Admin", SentAt = DateTime.Now.AddDays(-2), IsRead = true }
                    };
                    context.Messages.AddRange(messages);
                    await context.SaveChangesAsync();
                }
            }
        }

        private static async Task SeedReclamations(ApplicationDbContext context)
        {
            if (!context.Reclamations.Any())
            {
                var adminUser = context.Users.FirstOrDefault(u => u.Email == "admin@daycare.com");
                var parentUser = context.Users.FirstOrDefault(u => u.Email == "parent1@daycare.com");
                
                if (adminUser != null && parentUser != null)
                {
                    var reclamations = new List<Reclamation>
                    {
                        new Reclamation { SenderId = parentUser.Id, RecipientId = adminUser.Id, Subject = "Billing Issue", Content = "I noticed an error in my last invoice", SentAt = DateTime.Now.AddDays(-3), IsResolved = false },
                        new Reclamation { SenderId = parentUser.Id, RecipientId = adminUser.Id, Subject = "Schedule Change", Content = "Need pickup time change", SentAt = DateTime.Now.AddDays(-7), IsResolved = true, Response = "Approved", ResolvedAt = DateTime.Now.AddDays(-5) }
                    };
                    context.Reclamations.AddRange(reclamations);
                    await context.SaveChangesAsync();
                }
            }
        }

        private static async Task SeedNotifications(ApplicationDbContext context)
        {
            if (!context.Notifications.Any())
            {
                var parentUser = context.Users.FirstOrDefault(u => u.Email == "parent1@daycare.com");
                if (parentUser != null)
                {
                    var notifications = new List<Notification>
                    {
                        new Notification { UserId = parentUser.Id, Title = "Payment Due", Message = "Monthly fee is due in 5 days", Type = "Payment", IsRead = false, CreatedAt = DateTime.Now.AddDays(-1) },
                        new Notification { UserId = parentUser.Id, Title = "Event Reminder", Message = "Spring festival next week", Type = "Event", IsRead = true, CreatedAt = DateTime.Now.AddDays(-3) }
                    };
                    context.Notifications.AddRange(notifications);
                    await context.SaveChangesAsync();
                }
            }
        }

        private static async Task SeedHolidays(ApplicationDbContext context)
        {
            if (!context.Holidays.Any())
            {
                var holidays = new List<Holiday>
                {
                    new Holiday { Name = "Christmas", Date = new DateTime(DateTime.Now.Year, 12, 25), Description = "Christmas Day - Daycare Closed" },
                    new Holiday { Name = "New Year", Date = new DateTime(DateTime.Now.Year + 1, 1, 1), Description = "New Year's Day - Daycare Closed" },
                    new Holiday { Name = "Independence Day", Date = new DateTime(DateTime.Now.Year, 7, 4), Description = "Independence Day - Daycare Closed" }
                };
                context.Holidays.AddRange(holidays);
                await context.SaveChangesAsync();
            }
        }

        private static async Task SeedAppSettings(ApplicationDbContext context)
        {
            if (!context.AppSettings.Any())
            {
                var settings = new List<AppSetting>
                {
                    new AppSetting { Key = "DaycareName", Value = "Little Stars Daycare" },
                    new AppSetting { Key = "MaxCapacity", Value = "50" },
                    new AppSetting { Key = "OpenTime", Value = "07:00" },
                    new AppSetting { Key = "CloseTime", Value = "18:00" },
                    new AppSetting { Key = "ContactEmail", Value = "info@littlestars.com" },
                    new AppSetting { Key = "ContactPhone", Value = "555-1234" }
                };
                context.AppSettings.AddRange(settings);
                await context.SaveChangesAsync();
            }
        }
    }
}