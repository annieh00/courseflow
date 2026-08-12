package com.courseflow.backend.Friends;

import java.time.LocalDateTime;

public class FriendRequestDTO {
    private Long id;
    private String status;
    private FriendUserDTO sender;
    private FriendUserDTO receiver;
    private LocalDateTime createdAt;

    public FriendRequestDTO(Friend friend) {
        this.id = friend.getId();
        this.status = friend.getStatus().name();
        this.sender = new FriendUserDTO(friend.getSender());
        this.receiver = new FriendUserDTO(friend.getReceiver());
        this.createdAt = friend.getCreatedAt();
    }

    public Long getId() { return id; }
    public String getStatus() { return status; }
    public FriendUserDTO getSender() { return sender; }
    public FriendUserDTO getReceiver() { return receiver; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
