package com.courseflow.backend.advising.repositories;

import com.courseflow.backend.advising.entities.NoteEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface NoteRepository extends JpaRepository<NoteEntity, UUID> {
    List<NoteEntity> findByStudentId(UUID studentId);
}
