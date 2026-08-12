package com.courseflow.backend.Gamification;

import com.courseflow.backend.Users.User;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_badges", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "badge_key"})
})
public class UserBadge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "badge_key", nullable = false, columnDefinition = "VARCHAR(255)")
    private BadgeKey badgeKey;

    @Column(name = "earned_date", nullable = false)
    private LocalDateTime earnedDate;

    @Column(name = "notified", nullable = false)
    private boolean notified = false;

    public UserBadge() {}

    public UserBadge(User user, BadgeKey badgeKey) {
        this.user = user;
        this.badgeKey = badgeKey;
        this.earnedDate = LocalDateTime.now();
        this.notified = false;
    }

    public Long getId() { return id; }
    public User getUser() { return user; }
    public BadgeKey getBadgeKey() { return badgeKey; }
    public LocalDateTime getEarnedDate() { return earnedDate; }
    public boolean isNotified() { return notified; }
    public void setNotified(boolean notified) { this.notified = notified; }
}
