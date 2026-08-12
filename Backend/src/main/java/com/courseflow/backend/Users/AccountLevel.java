package com.courseflow.backend.Users;

public enum AccountLevel {
    STUDENT(1),
    ADVISOR(2),
    ADMIN(3);

    private final int rank;
    AccountLevel(int rank){
        this.rank = rank;
    }

    public int getRank() {
        return rank;
    }

    public boolean isHigherThan(AccountLevel other){
        return this.rank > other.getRank();
    }
}