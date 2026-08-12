package com.courseflow.backend.advising;

import com.courseflow.backend.advising.requests.AddAdviseeRequest;
import com.courseflow.backend.advising.requests.MessageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/advising")
public class AdvisingController {

    private final AdvisingService service;

    public AdvisingController(AdvisingService service) {
        this.service = service;
    }

    // GET /api/advising/{netid}
    @GetMapping("/{netid}")
    public ResponseEntity<Student> getStudent(@PathVariable String netid) {
        return service.getStudent(netid)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // GET /api/advising/students
    @GetMapping("/students")
    public List<Student> getStudents() {
        return service.getAllStudents();
    }

    // POST /api/advising/{advisorName}/advisees
    @PostMapping("/{advisorName}/advisees")
    public ResponseEntity<?> addAdvisee(@PathVariable String advisorName, @RequestBody AddAdviseeRequest req) {
        if (req == null || req.getNetid() == null) {
            return ResponseEntity.badRequest().body("netid required");
        }
        try {
            boolean added = service.addAdvisee(advisorName, req.getNetid());
            if (added) return ResponseEntity.status(HttpStatus.CREATED).build();
            return ResponseEntity.status(HttpStatus.CONFLICT).body("already exists or student not found");
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("server error: " + ex.getClass().getSimpleName() + ": " + ex.getMessage());
        }
    }

    // GET /api/advising/{netid}/plan
    @GetMapping("/{netid}/plan")
    public List<PlannedCourse> getPlan(@PathVariable String netid) {
        return service.getPlan(netid);
    }

    // GET /api/advising/{advisorName}/advisees
    @GetMapping("/{advisorName}/advisees")
    public List<Student> getAdvisees(@PathVariable String advisorName) {
        return service.getAdvisees(advisorName);
    }

    // GET /api/advising/{netid}/notes
    @GetMapping("/{netid}/notes")
    public List<Note> getNotes(@PathVariable String netid) {
        return service.getNotes(netid);
    }

    // POST /api/advising/{netid}/message  (stub — logs and returns accepted)
    @PostMapping("/{netid}/message")
    public ResponseEntity<?> postMessage(@PathVariable String netid, @RequestBody MessageRequest req) {
        if (!service.getStudent(netid).isPresent()) {
            return ResponseEntity.notFound().build();
        }
        service.sendMessageToAdvisee(netid, req.getSubject(), req.getBody());
        return ResponseEntity.accepted().build();
    }
}
