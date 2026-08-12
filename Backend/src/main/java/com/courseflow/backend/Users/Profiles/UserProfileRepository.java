package com.courseflow.backend.Users.Profiles;

import com.courseflow.backend.Users.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {

    Optional<UserProfile> findByUser(User user);

    boolean existsByUser(User user);
}
