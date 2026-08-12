package com.courseflow.backend.Gamification;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface UserBadgeRepository extends JpaRepository<UserBadge, Long> {

    @Query("SELECT ub FROM UserBadge ub WHERE ub.user.id = :userId")
    List<UserBadge> findByUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(ub) > 0 FROM UserBadge ub WHERE ub.user.id = :userId AND ub.badgeKey = :key")
    boolean existsByUserIdAndBadgeKey(@Param("userId") Long userId, @Param("key") BadgeKey key);

    @Query("SELECT ub FROM UserBadge ub WHERE ub.user.id = :userId AND ub.notified = false")
    List<UserBadge> findPendingByUserId(@Param("userId") Long userId);

    @Modifying
    @Query("UPDATE UserBadge ub SET ub.notified = true WHERE ub.user.id = :userId AND ub.notified = false")
    void markAllNotified(@Param("userId") Long userId);
}
