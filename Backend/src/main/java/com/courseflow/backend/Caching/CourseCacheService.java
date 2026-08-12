package com.courseflow.backend.Caching;

import com.courseflow.backend.Chatbot.Prerequisite;
import com.courseflow.backend.Chatbot.PrerequisiteRepository;
import com.courseflow.backend.Courses.Course;
import com.courseflow.backend.Courses.CourseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CourseCacheService {

    @Autowired
    private CourseRepository courseRepository;
    @Autowired private PrerequisiteRepository prerequisiteRepository;

    @Cacheable(value = "courseByNum", key = "#courseNum")
    public Optional<Course> findByCourseNum(String courseNum) {
        return courseRepository.findByCourseNum(courseNum);
    }

    @Cacheable(value = "courseById", key = "#id")
    public Optional<Course> findById(Integer id) {
        return courseRepository.findById(id);
    }

    @Cacheable(value = "prereqsExists", key = "#courseId")
    public boolean existsByCourseId(Integer courseId) {
        return prerequisiteRepository.existsByCourseId(courseId);
    }

    @Cacheable(value = "prereqsList", key = "#courseId")
    public List<Prerequisite> findByCourseId(Integer courseId) {
        return prerequisiteRepository.findByCourseIdOrderByLogicGroupId(courseId);
    }
}