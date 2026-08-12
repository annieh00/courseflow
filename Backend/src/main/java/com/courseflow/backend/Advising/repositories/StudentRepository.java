package com.courseflow.backend.advising.repositories;

import com.courseflow.backend.advising.entities.StudentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface StudentRepository extends JpaRepository<StudentEntity, UUID> {
    Optional<StudentEntity> findByNetid(String netid);
}
