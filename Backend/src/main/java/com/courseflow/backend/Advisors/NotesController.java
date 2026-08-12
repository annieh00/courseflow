package com.courseflow.backend.Advisors;

import com.courseflow.backend.Users.User;
import com.courseflow.backend.Users.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/notes")
public class NotesController {

    private final NoteRepository noteRepo;
    private final UserRepository userRepo;
    private final AdvisorAdviseeRepository advisorAdviseeRepo;

    public NotesController(
            NoteRepository noteRepo,
            UserRepository userRepo,
            AdvisorAdviseeRepository advisorAdviseeRepo
    ) {
        this.noteRepo = noteRepo;
        this.userRepo = userRepo;
        this.advisorAdviseeRepo = advisorAdviseeRepo;
    }

    // GET /api/notes/{studentNetid}?requesterNetid=abc123
    @GetMapping("/{studentNetid}")
    public ResponseEntity<?> getNotesForStudent(
            @PathVariable String studentNetid,
            @RequestParam String requesterNetid
    ) {
        Optional<User> studentOpt = userRepo.findByNetid(studentNetid);
        Optional<User> requesterOpt = userRepo.findByNetid(requesterNetid);

        if (studentOpt.isEmpty() || requesterOpt.isEmpty()) {
            return ResponseEntity.status(404).body("Student or requester not found");
        }

        User student = studentOpt.get();
        User requester = requesterOpt.get();

        // allow the student to view their own notes
        if (student.getId().equals(requester.getId())) {
            List<PublicNote> notes = noteRepo.findByStudent(student).stream()
                    .map(this::toPublicNote)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(notes);
        }

        // otherwise requester must be the student's advisor
        boolean isAdvisor = advisorAdviseeRepo.existsByAdvisorAndStudent(requester, student);
        if (!isAdvisor) {
            return ResponseEntity.status(403).body("Not authorized to view these notes");
        }

        List<PublicNote> notes = noteRepo.findByStudent(student).stream()
                .map(this::toPublicNote)
                .collect(Collectors.toList());

        return ResponseEntity.ok(notes);
    }

    // POST /api/notes
    @PostMapping
    public ResponseEntity<?> createNote(@RequestBody CreateNoteRequest req) {

        if (req.getAdvisorNetid() == null || req.getAdvisorNetid().isBlank()
                || req.getStudentNetid() == null || req.getStudentNetid().isBlank()) {
            return ResponseEntity.badRequest().body("advisorNetid and studentNetid are required");
        }

        if (req.getContent() == null || req.getContent().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("content is required");
        }

        String content = req.getContent().trim();
        if (content.length() > 255) {
            return ResponseEntity.badRequest().body("content must be <= 255 characters");
        }

        Optional<User> advisorOpt = userRepo.findByNetid(req.getAdvisorNetid());
        Optional<User> studentOpt = userRepo.findByNetid(req.getStudentNetid());

        if (advisorOpt.isEmpty() || studentOpt.isEmpty()) {
            return ResponseEntity.status(404).body("Advisor or student not found");
        }

        User advisor = advisorOpt.get();
        User student = studentOpt.get();

        boolean isAdvisee = advisorAdviseeRepo.existsByAdvisorAndStudent(advisor, student);
        if (!isAdvisee) {
            return ResponseEntity.status(403).body("Student is not an advisee of this advisor");
        }

        Note note = new Note();
        note.setUser(advisor);
        note.setAdvisor(advisor);
        note.setStudent(student);
        note.setContent(content);
        note.setNoteType(
                req.getNoteType() == null || req.getNoteType().isBlank()
                        ? "General"
                        : req.getNoteType().trim()
        );
        note.setCreatedAt(LocalDateTime.now());

        Note saved = noteRepo.save(note);
        return ResponseEntity.ok(toPublicNote(saved));
    }

    // DELETE /api/notes/{noteId}?requesterNetid=abc123
    @DeleteMapping("/{noteId}")
    public ResponseEntity<?> deleteNote(
            @PathVariable Long noteId,
            @RequestParam String requesterNetid
    ) {
        Optional<Note> noteOpt = noteRepo.findById(noteId);
        Optional<User> requesterOpt = userRepo.findByNetid(requesterNetid);

        if (noteOpt.isEmpty() || requesterOpt.isEmpty()) {
            return ResponseEntity.status(404).body("Note or requester not found");
        }

        Note note = noteOpt.get();
        User requester = requesterOpt.get();

        User student = note.getStudent();
        User advisor = note.getAdvisor();

        if (student == null) {
            return ResponseEntity.status(400).body("Note is not associated with a student");
        }

        // allow student to delete their own note
        if (student.getId().equals(requester.getId())) {
            noteRepo.delete(note);
            return ResponseEntity.ok("Note deleted");
        }

        // allow only the assigned advisor who authored the note
        boolean isAdvisor = advisorAdviseeRepo.existsByAdvisorAndStudent(requester, student);
        boolean isAuthorAdvisor = advisor != null && advisor.getId().equals(requester.getId());

        if (!isAdvisor || !isAuthorAdvisor) {
            return ResponseEntity.status(403).body("Not authorized to delete this note");
        }

        noteRepo.delete(note);
        return ResponseEntity.ok("Note deleted");
    }

    private PublicNote toPublicNote(Note n) {
        return new PublicNote(
                n.getId(),
                n.getContent(),
                n.getNoteType(),
                n.getCreatedAt(),
                n.getAdvisor() != null ? n.getAdvisor().getNetid() : null,
                n.getStudent() != null ? n.getStudent().getNetid() : null
        );
    }

    public static class PublicNote {
        private final Long id;
        private final String content;
        private final String noteType;
        private final LocalDateTime createdAt;
        private final String advisorNetid;
        private final String studentNetid;

        public PublicNote(
                Long id,
                String content,
                String noteType,
                LocalDateTime createdAt,
                String advisorNetid,
                String studentNetid
        ) {
            this.id = id;
            this.content = content;
            this.noteType = noteType;
            this.createdAt = createdAt;
            this.advisorNetid = advisorNetid;
            this.studentNetid = studentNetid;
        }

        public Long getId() { return id; }
        public String getContent() { return content; }
        public String getNoteType() { return noteType; }
        public LocalDateTime getCreatedAt() { return createdAt; }
        public String getAdvisorNetid() { return advisorNetid; }
        public String getStudentNetid() { return studentNetid; }
    }
}