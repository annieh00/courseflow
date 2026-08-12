package com.courseflow.backend.Courses;

import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.beans.factory.annotation.*;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.*;

import javax.swing.text.html.Option;
import java.util.List;
import java.util.Optional;
import java.util.Set;

/**
 * @author Soma Germano
 *         This class retrieves, creates and modifies courses from the database
 */
@RestController
@RequestMapping("/api")
public class CourseController {
    // repositories
    @Autowired
    CourseRepository courserepo;

    /**
     * adds course to user's degree progress plan
     */
    @PostMapping(path = "/courses/addCourse")
    public String addCourse(@RequestBody Course course) {

        // refactored code with changed to the database
        // //cant check if existing because new courses should not have an id before
        // being saved to db
        // Optional<Course> existingCourse = courserepo.findById(course.getId());
        // if(existingCourse.isPresent()){
        // return "course already exists";
        // }else{
        // courserepo.save(course);
        // return "new course created.";
        // }
        courserepo.save(course);
        return "new course created.";

    }

    // Read-Get Single Course (not user specific)
    @GetMapping(path = "/courses/search/{Course_num}")
    public Optional<Course> getCourse(@PathVariable String course_num) {
        Optional<Course> course = courserepo.findByCourseNum(course_num);
        if (course.isEmpty()) {
            return null;
        }
        return course;
    }

    // search courses by subject, course number or course level
    @GetMapping(path = "/courses/search")
    public List<Course> searchCourses(@RequestParam(required = false) String subject,
            @RequestParam(required = false) String courseNum,
            @RequestParam(required = false) String level) {
        return courserepo.searchCourses(subject, courseNum, level);
    }

    // Update course meeting location
    @PutMapping(path = "/courses/{id}")
    public String updateCourse(@PathVariable int id, @RequestBody String newName) {
        Optional<Course> existingCourse = courserepo.findById(id);
        if (existingCourse.isPresent()) {
            Course c1 = existingCourse.get();
            c1.setcoursenum(newName);
            courserepo.save(c1);
            return "class number changed";
        } else {
            return "class not found";
        }
    }

    // Delete Course
    @DeleteMapping(path = "/courses/{id}/delete")
    public String deleteCourse(@PathVariable int id) {
        Optional<Course> existingCourse = courserepo.findById(id);
        if (existingCourse.isPresent()) {
            courserepo.deleteById(existingCourse.get().getId());
            return "course deleted";
        } else {
            return "course not found in database";
        }
    }

}
