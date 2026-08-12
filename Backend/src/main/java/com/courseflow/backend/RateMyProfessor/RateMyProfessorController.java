package com.courseflow.backend.RateMyProfessor;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ratemyprofessor")
public class RateMyProfessorController {
    private static final String schoolId = "U2Nob29sLTQ1Mg==";
    private final RateMyProfessorService professorService;
    private final RateMyProfessorSchoolService schoolService;

    public RateMyProfessorController(RateMyProfessorService professorService, RateMyProfessorSchoolService schoolService) {
        this.professorService = professorService;
        this.schoolService = schoolService;
    }

    // professors search by name
    @GetMapping("/professors/search")
    public JsonNode searchProfessors(@RequestParam String name) {
        return professorService.searchProfessors(name, schoolId);
    }

    // this returns all rmp has for the school
    @GetMapping("/school")
    public JsonNode getSchoolInfo() {
        return schoolService.searchSchools("Iowa State University");
    }

}
