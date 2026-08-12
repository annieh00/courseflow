package com.courseflow.backend.CoursePlan;

import java.util.List;

public class PrereqGroupViolation {
    private List<String> options;
    private boolean coreq;

    public List<String> getOptions() { return options; }
    public void setOptions(List<String> options) { this.options = options; }

    public boolean isCoreq() { return coreq; }
    public void setCoreq(boolean coreq) { this.coreq = coreq; }
}
