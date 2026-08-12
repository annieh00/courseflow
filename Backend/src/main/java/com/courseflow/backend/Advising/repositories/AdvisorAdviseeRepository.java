package com.courseflow.backend.advising.repositories;

import com.courseflow.backend.advising.entities.AdvisorAdviseeEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AdvisorAdviseeRepository extends JpaRepository<AdvisorAdviseeEntity, UUID> {
    List<AdvisorAdviseeEntity> findByAdvisorId(UUID advisorId);
    Optional<AdvisorAdviseeEntity> findByAdvisorIdAndStudentId(UUID advisorId, UUID studentId);
}
