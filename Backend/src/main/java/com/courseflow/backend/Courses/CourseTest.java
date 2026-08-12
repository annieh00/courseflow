//package com.courseflow.backend.Courses;
//
//import org.junit.jupiter.api.Test;
//import static org.junit.jupiter.api.Assertions.*;
//
//import com.courseflow.backend.Courses.*;
//
//public class CourseTest {
//    @Test
//    void testSimple(){
//        assertTrue(true);
//    }
//    @Test
//    void testDefaultConstructor() {
//        Course course = new Course();
//
//        assertNull(course.getcourseNum());
//        assertNull(course.getCourseName());
//        assertNull(course.getDescription());
//        assertNull(course.getCourse_level());
//        assertNull(course.getCredits());
//        assertNull(course.getRemainingSeats());
//        assertNull(course.getLocation());
//        assertNull(course.getProfessors());
//        assertNull(course.getSectionNum());
//        assertNull(course.getAcademicPeriod());
//        assertNull(course.getMeetingTimes());
//    }
//
//    @Test
//    void testCustomConstructor() {
//        Course course = new Course("SE 186");
//        assertEquals("SE 186", course.getcourseNum());
//    }
//
//    @Test
//    void testSettersAndGetters() {
//        Course course = new Course();
//
//        course.setcoursenum("SE 186");
//        course.setCoursename("Problem Solving in Software Engineering II");
//        course.setDescription("Description here");
//        course.setCourse_level("1000");
//        course.setCredits("1");
//        course.setRemainingSeats(30);
//        course.setLocation("Tech LR4");
//        course.setProfessors("Goce Trajcevski");
//        course.setSectionNum("001");
//        course.setAcademicPeriod("Fall 2025");
//        course.setMeetingTimes("MWF 10–11AM");
//
//        assertEquals("SE 186", course.getcourseNum());
//        assertEquals("Problem Solving in Software Engineering II", course.getCourseName());
//        assertEquals("Description here", course.getDescription());
//        assertEquals("1000", course.getCourse_level());
//        assertEquals("1", course.getCredits());
//        assertEquals(30, course.getRemainingSeats());
//        assertEquals("Tech LR4", course.getLocation());
//        assertEquals("Goce Trajcevski", course.getProfessors());
//        assertEquals("001", course.getSectionNum());
//        assertEquals("Fall 2025", course.getAcademicPeriod());
//        assertEquals("MWF 10–11AM", course.getMeetingTimes());
//    }
//
//    @Test
//    void testSetRemainingSeatsWithNull() {
//        Course course = new Course();
//        course.setRemainingSeats(null);
//        assertNull(course.getRemainingSeats());
//    }

//}
