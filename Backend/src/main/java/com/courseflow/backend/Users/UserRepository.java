package com.courseflow.backend.Users;

import org.neo4j.cypherdsl.core.Use;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> { // String as ID type
  Optional<User> findByNetid(String netid);

  Optional<User> findById(Long id);

  boolean existsByNetid(String netid);

  // this method to find users by refresh token
  @Query("SELECT u FROM User u JOIN u.refreshTokens rt WHERE VALUE(rt) = :refreshToken")
  Optional<User> findByRefreshToken(@Param("refreshToken") String refreshToken);

  Optional<User> findByEmail(String email);

  Optional<User> findByGoogleId(String googleId);

  @Query("""
      SELECT u FROM User u
      WHERE u.id <> :currentUserId
        AND (
          LOWER(u.fullName) LIKE CONCAT('%', :query, '%')
          OR LOWER(u.firstName) LIKE CONCAT('%', :query, '%')
          OR LOWER(u.lastName) LIKE CONCAT('%', :query, '%')
          OR LOWER(u.netid) LIKE CONCAT('%', :query, '%')
          OR LOWER(u.email) LIKE CONCAT('%', :query, '%')
        )
      ORDER BY u.fullName ASC
      """)
  List<User> searchFriendsCandidates(@Param("currentUserId") Long currentUserId,
      @Param("query") String query);

  @Query("""
      SELECT u FROM User u
      WHERE u.id <> :currentUserId
        AND NOT EXISTS (
          SELECT f FROM Friend f
          WHERE (f.sender.id = :currentUserId AND f.receiver = u)
             OR (f.receiver.id = :currentUserId AND f.sender = u)
        )
      ORDER BY u.fullName ASC
      """)
  List<User> findPotentialFriends(@Param("currentUserId") Long currentUserId);

  long countByRole(AccountLevel role);

  @Query("SELECT COUNT(u) from User u WHERE u.requestedRole = :role AND u.status = :status")
  long countByRequestedRoleAndStatus(@Param("role") AccountLevel requestedRole,
      @Param("status") UserApprovalStatus status);

  List<User> findAllByRoleAndStatus(AccountLevel role, UserApprovalStatus status);

  long countByRoleAndStatus(AccountLevel role, UserApprovalStatus status);

  List<User> findAllByStatus(UserApprovalStatus status);

  @Query("SELECT u from User u WHERE u.requestedRole =:role AND u.status =:status")
  List<User> findAllByRequestedRoleAndStatus(@Param("role") AccountLevel requestedRole,
      @Param("status") UserApprovalStatus status);
}
