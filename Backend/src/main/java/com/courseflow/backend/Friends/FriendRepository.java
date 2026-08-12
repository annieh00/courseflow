package com.courseflow.backend.Friends;

import com.courseflow.backend.Users.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FriendRepository extends JpaRepository<Friend, Long> {

    @Query("""
            SELECT f FROM Friend f
            WHERE (f.sender.id = :firstUserId AND f.receiver.id = :secondUserId)
               OR (f.sender.id = :secondUserId AND f.receiver.id = :firstUserId)
            """)
    Optional<Friend> findBetweenUsers(@Param("firstUserId") Long firstUserId,
                                      @Param("secondUserId") Long secondUserId);

    @Query("""
            SELECT f FROM Friend f
            WHERE ((f.sender.id = :firstUserId AND f.receiver.id = :secondUserId)
               OR (f.sender.id = :secondUserId AND f.receiver.id = :firstUserId))
              AND f.status = :status
            """)
    Optional<Friend> findBetweenUsersWithStatus(@Param("firstUserId") Long firstUserId,
                                                @Param("secondUserId") Long secondUserId,
                                                @Param("status") FriendshipStatus status);

    List<Friend> findByReceiverAndStatusOrderByCreatedAtDesc(User receiver, FriendshipStatus status);

    List<Friend> findBySenderAndStatusOrderByCreatedAtDesc(User sender, FriendshipStatus status);

    @Query("""
            SELECT f FROM Friend f
            WHERE (f.sender = :user OR f.receiver = :user)
              AND f.status = :status
            ORDER BY f.updatedAt DESC
            """)
    List<Friend> findAllForUserWithStatus(@Param("user") User user,
                                          @Param("status") FriendshipStatus status);
}
