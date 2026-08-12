package com.courseflow.backend.CoursePlan;

import java.util.List;
import java.util.Optional;

import com.courseflow.backend.Courses.Course;
import com.courseflow.backend.Courses.CourseRepository;
import com.courseflow.backend.Users.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.ListCrudRepository;
import org.springframework.transaction.annotation.Transactional;

public interface CoursePlanRepository extends JpaRepository<CoursePlan, Integer> {
    List<CoursePlan> findByUser(User user);

    Optional<CoursePlan> findById(int id);

    CoursePlan save(Course course);

    @Transactional
    void deleteById(int id);
}
