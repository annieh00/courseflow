package com.courseflow.backend.Users.DegreePlan;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserDegreePlanRepository extends JpaRepository<UserDegreePlan, Long> {
    // Find all plans for a specific user
    List<UserDegreePlan> findByUserId(Long userId);

    // Find a specific plan (e.g., the "SE" plan) for a specific user
    Optional<UserDegreePlan> findByUserIdAndDegreeProgram_ProgramId(Long userId, String programId);}