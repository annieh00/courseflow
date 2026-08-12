package com.courseflow.backend.DegreePrograms;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DegreeProgramSeeder implements CommandLineRunner {

    private final DegreeProgramRepository repository;

    public DegreeProgramSeeder(DegreeProgramRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(String... args) throws Exception {
        // Only seed the data if the table is completely empty!
        if (repository.count() == 0) {
            System.out.println("🌱 Database Seeder: Populating Degree Programs from CSV baseline...");

            String engineering = "College of Engineering";

            List<DegreeProgram> defaultPrograms = List.of(
                    // Core Engineering Majors
                    new DegreeProgram("SE", "Software Engineering", DegreeType.MAJOR, engineering),
                    new DegreeProgram("CYBE", "Cyber Security Engineering", DegreeType.MAJOR, engineering),
                    new DegreeProgram("CPRE", "Computer Engineering", DegreeType.MAJOR, engineering),
                    new DegreeProgram("AERE", "Aerospace Engineering", DegreeType.MAJOR, engineering),
                    new DegreeProgram("ME", "Mechanical Engineering", DegreeType.MAJOR, engineering),
                    new DegreeProgram("MATE", "Materials Engineering", DegreeType.MAJOR, engineering),

                    // Construction Engineering Emphases (Treated as specific majors)
                    new DegreeProgram("CONE_BUILDING", "Construction Engineering - Building Emphasis", DegreeType.MAJOR, engineering),
                    new DegreeProgram("CONE_ELECTRICAL", "Construction Engineering - Electrical Emphasis", DegreeType.MAJOR, engineering),
                    new DegreeProgram("CONE_INFRASTRUCTURE", "Construction Engineering - Infrastructure Emphasis", DegreeType.MAJOR, engineering),
                    new DegreeProgram("CONE_MECHANICAL", "Construction Engineering - Mechanical Emphasis", DegreeType.MAJOR, engineering),

                    // Minors
                    new DegreeProgram("CYBE_MINOR", "Cyber Security", DegreeType.MINOR, engineering),
                    new DegreeProgram("ENGR_SALES_MINOR", "Engineering Sales", DegreeType.MINOR, engineering),
                    new DegreeProgram("BME_MINOR", "Biomedical Engineering", DegreeType.MINOR, engineering),
                    new DegreeProgram("ENERGY_SYSTEMS_MINOR", "Energy Systems", DegreeType.MINOR, engineering),
                    new DegreeProgram("CYBER_PHYSICAL_MINOR", "Cyber-Physical Systems", DegreeType.MINOR, engineering)
            );

            repository.saveAll(defaultPrograms);
            System.out.println("seeded sucessfully :)");
        }
    }
}