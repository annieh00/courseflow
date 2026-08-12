package com.courseflow.backend.Friends;

import com.courseflow.backend.Users.User;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/friends")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:8081"})
public class FriendsController {

    private final FriendService friendService;

    public FriendsController(FriendService friendService) {
        this.friendService = friendService;
    }

    @GetMapping
    public List<FriendUserDTO> getFriends(@RequestHeader("Authorization") String authHeader) {
        User user = friendService.getCurrentUser(authHeader);
        return friendService.getFriends(user);
    }

    @GetMapping("/potential")
    public List<FriendUserDTO> getPotentialFriends(@RequestHeader("Authorization") String authHeader) {
        User user = friendService.getCurrentUser(authHeader);
        return friendService.getPotentialFriends(user);
    }

    @GetMapping("/search")
    public List<FriendUserDTO> searchUsers(@RequestHeader("Authorization") String authHeader,
                                           @RequestParam(defaultValue = "") String query) {
        User user = friendService.getCurrentUser(authHeader);
        return friendService.searchUsers(user, query);
    }

    @DeleteMapping("/{friendUserId}")
    public ResponseEntity<Void> removeFriend(@RequestHeader("Authorization") String authHeader,
                                             @PathVariable Long friendUserId) {
        User user = friendService.getCurrentUser(authHeader);
        friendService.removeFriend(user, friendUserId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/requests/incoming")
    public List<FriendRequestDTO> getIncomingRequests(@RequestHeader("Authorization") String authHeader) {
        User user = friendService.getCurrentUser(authHeader);
        return friendService.getIncomingRequests(user);
    }

    @GetMapping("/requests/outgoing")
    public List<FriendRequestDTO> getOutgoingRequests(@RequestHeader("Authorization") String authHeader) {
        User user = friendService.getCurrentUser(authHeader);
        return friendService.getOutgoingRequests(user);
    }

    @PostMapping("/requests/{receiverId}")
    public ResponseEntity<FriendRequestDTO> sendRequest(@RequestHeader("Authorization") String authHeader,
                                                        @PathVariable Long receiverId) {
        User user = friendService.getCurrentUser(authHeader);
        return ResponseEntity.status(HttpStatus.CREATED).body(friendService.sendRequest(user, receiverId));
    }

    @PostMapping("/requests/{requestId}/accept")
    public FriendRequestDTO acceptRequest(@RequestHeader("Authorization") String authHeader,
                                          @PathVariable Long requestId) {
        User user = friendService.getCurrentUser(authHeader);
        return friendService.acceptRequest(user, requestId);
    }

    @DeleteMapping("/requests/{requestId}/reject")
    public ResponseEntity<Void> rejectRequest(@RequestHeader("Authorization") String authHeader,
                                              @PathVariable Long requestId) {
        User user = friendService.getCurrentUser(authHeader);
        friendService.rejectRequest(user, requestId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/requests/{requestId}/cancel")
    public ResponseEntity<Void> cancelRequest(@RequestHeader("Authorization") String authHeader,
                                              @PathVariable Long requestId) {
        User user = friendService.getCurrentUser(authHeader);
        friendService.cancelRequest(user, requestId);
        return ResponseEntity.noContent().build();
    }
}
