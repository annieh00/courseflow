package com.courseflow.backend.DegreePrograms;

public class DegreeOptionDTO {
    private String id;
    private String name;
    private DegreeType type;

    public DegreeOptionDTO(String id, String name, DegreeType type) {
        this.id = id;
        this.name = name;
        this.type = type;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public DegreeType getType() { return type; }
    public void setType(DegreeType type) { this.type = type; }
}