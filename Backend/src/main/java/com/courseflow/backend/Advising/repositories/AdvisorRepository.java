package com.courseflow.backend.advising.repositories;

import com.courseflow.backend.advising.entities.AdvisorEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface AdvisorRepository extends JpaRepository<AdvisorEntity, UUID> {
    Optional<AdvisorEntity> findByNetid(String netid);
}
