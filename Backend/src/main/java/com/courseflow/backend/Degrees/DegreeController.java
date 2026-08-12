package com.courseflow.backend.Degrees;

import com.courseflow.backend.Courses.Course;
import com.courseflow.backend.Degrees.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.*;

import javax.swing.text.html.Option;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@RestController
public class DegreeController {

    @Autowired
    DegreeRepository degree_repo;

    //TODO: CREATE A DEGREE (requestbody should include whether a major or minor)
    @PostMapping(path = "/degree/add")
    public String createDegree(@RequestBody Degree d){
        degree_repo.save(d);
        return "degree created successfully";
    }
    // READ OR GET A DEGREE (minor)
    @GetMapping(path = "/degree/minor")
    public Optional<Degree> getDegreeMinor(@RequestBody String name){
        Optional<Degree> d = degree_repo.findBySubject(name);
        if(d.isEmpty()){
            return null;
        }
        return d;
    }
    //READ OR GET A DEGREE (major)
    @GetMapping(path = "/degree/major")
    public Optional<Degree> getDegreeMajor(@RequestBody String name){
        Optional<Degree> d = degree_repo.findBySubject(name);
        if(d.isEmpty()){
            return null;
        }
        return d;
    }
    // UPDATE A DEGREE - change credits
    @PutMapping(path = "/degree/update/{name}")
    public String updateDegreeCreds(@RequestBody int new_credits, @PathVariable String name){
        Optional<Degree> existing_degree = degree_repo.findBySubject(name);
        if(existing_degree.isPresent()){
            Degree d1 = existing_degree.get();
            d1.setCredits_required(new_credits);
            degree_repo.save(d1);
            return "credits updated";
        }
        return "degree does not exist";
    }

    //TODO: DELETE A DEGREE PROGRAM
    @DeleteMapping(path = "/degree/delete/{id}")
    public String deleteDegree(@RequestBody int id){
        Optional<Degree> existingDegree = degree_repo.findById(id);
        if(existingDegree.isPresent()){
            degree_repo.deleteById(id);
            return "degree program deleted";
        }
        return "degree does not exist";
    }

}
