package com.courseflow.backend.advising;

import com.courseflow.backend.advising.entities.*;
import com.courseflow.backend.advising.repositories.*;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdvisingService {

    private final StudentRepository studentRepo;
    private final AdvisorRepository advisorRepo;
    private final PlannedCourseRepository plannedCourseRepo;
    private final NoteRepository noteRepo;
    private final com.courseflow.backend.advising.repositories.AdvisorAdviseeRepository advisorAdviseeRepo;

    public AdvisingService(StudentRepository studentRepo,
                          AdvisorRepository advisorRepo,
                          PlannedCourseRepository plannedCourseRepo,
                          NoteRepository noteRepo,
                          com.courseflow.backend.advising.repositories.AdvisorAdviseeRepository advisorAdviseeRepo) {
        this.studentRepo = studentRepo;
        this.advisorRepo = advisorRepo;
        this.plannedCourseRepo = plannedCourseRepo;
        this.noteRepo = noteRepo;
        this.advisorAdviseeRepo = advisorAdviseeRepo;
    }

    public Optional<Student> getStudent(String netid) {
        return studentRepo.findByNetid(netid).map(e -> {
            Student s = new Student();
            s.setId(e.getId() == null ? null : e.getId().toString());
            s.setName(e.getName());
            s.setNetid(e.getNetid());
            s.setMajor(e.getMajor());
            s.setClassStanding(e.getClassStanding());
            s.setGpa(e.getGpa());
            s.setCreditsCompleted(e.getCreditsCompleted());
            s.setCreditsRequired(e.getCreditsRequired());
            s.setGraduationYear(e.getGraduationYear());
            s.setPhotoUrl(e.getPhotoUrl());
            return s;
        });
    }

    public List<Student> getAllStudents() {
        return studentRepo.findAll().stream().map(e -> {
            Student s = new Student();
            s.setId(e.getId() == null ? null : e.getId().toString());
            s.setName(e.getName());
            s.setNetid(e.getNetid());
            s.setMajor(e.getMajor());
            s.setClassStanding(e.getClassStanding());
            s.setGpa(e.getGpa());
            s.setCreditsCompleted(e.getCreditsCompleted());
            s.setCreditsRequired(e.getCreditsRequired());
            s.setGraduationYear(e.getGraduationYear());
            s.setPhotoUrl(e.getPhotoUrl());
            return s;
        }).collect(Collectors.toList());
    }

    public List<PlannedCourse> getPlan(String netid) {
        Optional<StudentEntity> se = studentRepo.findByNetid(netid);
        if (!se.isPresent()) return Collections.emptyList();
        UUID sid = se.get().getId();
        return plannedCourseRepo.findByStudentId(sid).stream().map(e ->
                new PlannedCourse(e.getId().toString(), e.getCourseCode(), e.getTitle(), e.getTerm(), e.getStatus(), e.getCredits())
        ).collect(Collectors.toList());
    }

    public List<Note> getNotes(String netid) {
        Optional<StudentEntity> se = studentRepo.findByNetid(netid);
        if (!se.isPresent()) return Collections.emptyList();
        UUID sid = se.get().getId();
        return noteRepo.findByStudentId(sid).stream().map(e ->
                new Note(e.getId().toString(), e.getNoteDate() == null ? "" : e.getNoteDate().toString(), e.getType(), e.getSummary(), e.getDetail())
        ).collect(Collectors.toList());
    }

    public List<Student> getAdvisees(String advisorName) {
        Optional<AdvisorEntity> a = advisorRepo.findByNetid(advisorName);
        if (!a.isPresent()) return Collections.emptyList();
        UUID aid = a.get().getId();
        return advisorAdviseeRepo.findByAdvisorId(aid).stream().map(rel -> {
            Optional<StudentEntity> s = studentRepo.findById(rel.getStudentId());
            if (s.isPresent()) {
                StudentEntity e = s.get();
                Student st = new Student();
                st.setId(e.getId().toString());
                st.setNetid(e.getNetid());
                st.setName(e.getName());
                st.setMajor(e.getMajor());
                st.setClassStanding(e.getClassStanding());
                st.setGpa(e.getGpa());
                st.setCreditsCompleted(e.getCreditsCompleted());
                st.setCreditsRequired(e.getCreditsRequired());
                st.setGraduationYear(e.getGraduationYear());
                st.setPhotoUrl(e.getPhotoUrl());
                return st;
            }
            return null;
        }).filter(Objects::nonNull).collect(Collectors.toList());
    }

    public boolean addAdvisee(String advisorName, String netid) {
        Optional<AdvisorEntity> a = advisorRepo.findByNetid(advisorName);
        Optional<StudentEntity> s = studentRepo.findByNetid(netid);
        if (!s.isPresent()) return false;
        UUID sid = s.get().getId();
        UUID aid;
        if (!a.isPresent()) {
            AdvisorEntity newA = new AdvisorEntity();
            newA.setNetid(advisorName);
            newA.setName(advisorName);
            // ensure required DB columns are set (some schemas enforce non-null role)
            newA.setRole("advisor");
            newA = advisorRepo.save(newA);
            aid = newA.getId();
        } else aid = a.get().getId();

        boolean exists = advisorAdviseeRepo.findByAdvisorIdAndStudentId(aid, sid).isPresent();
        if (exists) return false;
        AdvisorAdviseeEntity rel = new AdvisorAdviseeEntity();
        rel.setAdvisorId(aid);
        rel.setStudentId(sid);
        advisorAdviseeRepo.save(rel);
        return true;
    }

    public void sendMessageToAdvisee(String netid, String subject, String body) {
        // store message record and stub sending
        Optional<StudentEntity> se = studentRepo.findByNetid(netid);
        if (!se.isPresent()) return;
        PlannedCourseEntity ignore = null;
        // create messages table interaction if desired; currently stubbed
        System.out.println("[AdvisingService] sendMessageToAdvisee to=" + netid + " subject=" + subject);
    }
}
