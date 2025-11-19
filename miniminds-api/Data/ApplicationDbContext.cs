using DaycareAPI.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace DaycareAPI.Data
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Parent> Parents { get; set; }
        public DbSet<Child> Children { get; set; }
        public DbSet<DailyActivity> DailyActivities { get; set; }
        public DbSet<Attendance> Attendances { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<DaycareProgram> DaycarePrograms { get; set; }
        public DbSet<ProgramEnrollment> ProgramEnrollments { get; set; }
        public DbSet<Message> Messages { get; set; }
        public DbSet<Teacher> Teachers { get; set; }
        public DbSet<Event> Events { get; set; }
        public DbSet<EventParticipant> EventParticipants { get; set; }
        public DbSet<LeaveRequest> LeaveRequests { get; set; }
        public DbSet<AppSetting> AppSettings { get; set; }
        public DbSet<Holiday> Holidays { get; set; }
        public DbSet<ChildParent> ChildParents { get; set; }
        public DbSet<Class> Classes { get; set; }
        public DbSet<ClassEnrollment> ClassEnrollments { get; set; }
        public DbSet<ClassTeacher> ClassTeachers { get; set; }
        public DbSet<Fee> Fees { get; set; }
        public DbSet<Reclamation> Reclamations { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // Configure relationships
            builder.Entity<Child>()
                .HasOne(c => c.Parent)
                .WithMany(p => p.Children)
                .HasForeignKey(c => c.ParentId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<DailyActivity>()
                .HasOne(da => da.Child)
                .WithMany(c => c.DailyActivities)
                .HasForeignKey(da => da.ChildId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<Attendance>()
                .HasOne(a => a.Child)
                .WithMany(c => c.Attendances)
                .HasForeignKey(a => a.ChildId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<ProgramEnrollment>()
                .HasOne(pe => pe.Program)
                .WithMany(p => p.Enrollments)
                .HasForeignKey(pe => pe.ProgramId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<ProgramEnrollment>()
                .HasOne(pe => pe.Child)
                .WithMany()
                .HasForeignKey(pe => pe.ChildId)
                .OnDelete(DeleteBehavior.Cascade);

            // Prevent duplicate enrollments
            builder.Entity<ProgramEnrollment>()
                .HasIndex(pe => new { pe.ProgramId, pe.ChildId })
                .IsUnique();

            // Indexes for better performance
            builder.Entity<Parent>()
                .HasIndex(p => p.Email)
                .IsUnique();

            builder.Entity<Attendance>()
                .HasIndex(a => new { a.ChildId, a.Date });

            builder.Entity<DailyActivity>()
                .HasIndex(da => new { da.ChildId, da.ActivityTime });

            // Message relationships
            builder.Entity<Message>()
                .HasOne(m => m.Sender)
                .WithMany()
                .HasForeignKey(m => m.SenderId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Message>()
                .HasOne(m => m.Recipient)
                .WithMany()
                .HasForeignKey(m => m.RecipientId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Message>()
                .HasOne(m => m.ParentMessage)
                .WithMany(m => m.Replies)
                .HasForeignKey(m => m.ParentMessageId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.Entity<Message>()
                .HasIndex(m => new { m.SenderId, m.RecipientId, m.SentAt });

            // EventParticipant relationships
            builder.Entity<EventParticipant>()
                .HasOne(ep => ep.Event)
                .WithMany(e => e.Participants)
                .HasForeignKey(ep => ep.EventId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<EventParticipant>()
                .HasOne(ep => ep.Child)
                .WithMany()
                .HasForeignKey(ep => ep.ChildId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<EventParticipant>()
                .HasIndex(ep => new { ep.EventId, ep.ChildId })
                .IsUnique();

            // ChildParent relationships
            builder.Entity<ChildParent>()
                .HasOne(cp => cp.Child)
                .WithMany(c => c.ChildParents)
                .HasForeignKey(cp => cp.ChildId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<ChildParent>()
                .HasOne(cp => cp.Parent)
                .WithMany(p => p.ChildParents)
                .HasForeignKey(cp => cp.ParentId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<ChildParent>()
                .HasIndex(cp => new { cp.ChildId, cp.ParentId })
                .IsUnique();

            // ClassEnrollment relationships
            builder.Entity<ClassEnrollment>()
                .HasOne(ce => ce.Class)
                .WithMany()
                .HasForeignKey(ce => ce.ClassId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<ClassEnrollment>()
                .HasOne(ce => ce.Child)
                .WithMany()
                .HasForeignKey(ce => ce.ChildId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<ClassEnrollment>()
                .HasIndex(ce => new { ce.ClassId, ce.ChildId })
                .IsUnique();

            // ClassTeacher relationships
            builder.Entity<ClassTeacher>()
                .HasOne(ct => ct.Class)
                .WithMany()
                .HasForeignKey(ct => ct.ClassId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<ClassTeacher>()
                .HasOne(ct => ct.Teacher)
                .WithMany()
                .HasForeignKey(ct => ct.TeacherId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<ClassTeacher>()
                .HasIndex(ct => new { ct.ClassId, ct.TeacherId })
                .IsUnique();
        }
    }
}