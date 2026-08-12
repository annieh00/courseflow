package com.courseflow.backend.Advisors;

import com.courseflow.backend.Users.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NoteRepository extends JpaRepository<Note, Long> {

    List<Note> findByStudent(User student);

    // optional: if you want notes written by a specific advisor
    List<Note> findByStudentAndAdvisor(User student, User advisor);
}