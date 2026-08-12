package com.courseflow.backend.SmartScheduler;

import com.courseflow.backend.SmartScheduler.Entity.AcademicPeriod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface AcademicPeriodRepository extends JpaRepository<AcademicPeriod, Integer> {
    Optional<AcademicPeriod> findByName(String name);
}