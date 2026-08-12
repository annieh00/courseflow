package com.courseflow.backend.advising.requests;

public class AddAdviseeRequest {
    private String netid;

    public AddAdviseeRequest() {}

    public AddAdviseeRequest(String netid) { this.netid = netid; }

    public String getNetid() { return netid; }
    public void setNetid(String netid) { this.netid = netid; }
}
