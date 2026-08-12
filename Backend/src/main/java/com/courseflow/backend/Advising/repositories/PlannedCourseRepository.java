package com.courseflow.backend.advising.repositories;

import com.courseflow.backend.advising.entities.PlannedCourseEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface PlannedCourseRepository extends JpaRepository<PlannedCourseEntity, UUID> {
    List<PlannedCourseEntity> findByStudentId(UUID studentId);
}
