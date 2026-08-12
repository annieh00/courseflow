package com.courseflow.backend.Friends;

import com.courseflow.backend.Settings.SettingsRepository;
import com.courseflow.backend.Users.JwtService;
import com.courseflow.backend.Users.User;
import com.courseflow.backend.Users.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.List;

@Service
public class FriendService {

    private final FriendRepository friendRepository;
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final SettingsRepository settingsRepository;

    public FriendService(FriendRepository friendRepository,
                         UserRepository userRepository,
                         JwtService jwtService,
                         SettingsRepository settingsRepository) {
        this.friendRepository = friendRepository;
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.settingsRepository = settingsRepository;
    }

    private boolean isProfileVisible(User user) {
        return settingsRepository.findById(user.getNetid())
                .map(s -> s.isProfileVisible())
                .orElse(true);
    }

    public User getCurrentUser(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing bearer token");
        }

        Long userId = jwtService.extractUserId(authHeader.replace("Bearer ", ""));
        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or expired token");
        }

        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    @Transactional(readOnly = true)
    public List<FriendUserDTO> getFriends(User user) {
        return friendRepository.findAllForUserWithStatus(user, FriendshipStatus.ACCEPTED)
                .stream()
                .map(friend -> friend.getSender().getId().equals(user.getId())
                        ? friend.getReceiver()
                        : friend.getSender())
                .map(friendUser -> new FriendUserDTO(friendUser, FriendshipStatus.ACCEPTED))
                .sorted(Comparator.comparing(FriendUserDTO::getName, Comparator.nullsLast(String::compareToIgnoreCase)))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<FriendRequestDTO> getIncomingRequests(User user) {
        return friendRepository.findByReceiverAndStatusOrderByCreatedAtDesc(user, FriendshipStatus.PENDING)
                .stream()
                .map(FriendRequestDTO::new)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<FriendRequestDTO> getOutgoingRequests(User user) {
        return friendRepository.findBySenderAndStatusOrderByCreatedAtDesc(user, FriendshipStatus.PENDING)
                .stream()
                .map(FriendRequestDTO::new)
                .toList();
    }

    @Transactional
    public FriendRequestDTO sendRequest(User sender, Long receiverId) {
        if (sender.getId().equals(receiverId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot friend yourself");
        }

        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Friend not found"));

        Friend existing = friendRepository.findBetweenUsers(sender.getId(), receiver.getId()).orElse(null);
        if (existing != null) {
            if (existing.getStatus() == FriendshipStatus.DECLINED) {
                existing.setSender(sender);
                existing.setReceiver(receiver);
                existing.setStatus(FriendshipStatus.PENDING);
                return new FriendRequestDTO(friendRepository.save(existing));
            }
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A friendship or request already exists");
        }

        return new FriendRequestDTO(friendRepository.save(new Friend(sender, receiver, FriendshipStatus.PENDING)));
    }

    @Transactional
    public FriendRequestDTO acceptRequest(User receiver, Long requestId) {
        Friend request = getRequestForReceiver(receiver, requestId);
        request.setStatus(FriendshipStatus.ACCEPTED);
        return new FriendRequestDTO(friendRepository.save(request));
    }

    @Transactional
    public void rejectRequest(User receiver, Long requestId) {
        Friend request = getRequestForReceiver(receiver, requestId);
        friendRepository.delete(request);
    }

    @Transactional
    public void cancelRequest(User sender, Long requestId) {
        Friend request = friendRepository.findById(requestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Friend request not found"));
        if (!request.getSender().getId().equals(sender.getId()) || request.getStatus() != FriendshipStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only cancel your own pending requests");
        }
        friendRepository.delete(request);
    }

    @Transactional
    public void removeFriend(User user, Long friendUserId) {
        Friend friendship = friendRepository.findBetweenUsersWithStatus(user.getId(), friendUserId, FriendshipStatus.ACCEPTED)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Friendship not found"));
        friendRepository.delete(friendship);
    }

    @Transactional(readOnly = true)
    public List<FriendUserDTO> searchUsers(User currentUser, String query) {
        String normalized = query == null ? "" : query.trim().toLowerCase();
        if (normalized.length() < 2) {
            return List.of();
        }

        return userRepository.searchFriendsCandidates(currentUser.getId(), normalized)
                .stream()
                .filter(this::isProfileVisible)
                .limit(20)
                .map(user -> new FriendUserDTO(
                        user,
                        friendRepository.findBetweenUsers(currentUser.getId(), user.getId())
                                .map(Friend::getStatus)
                                .orElse(null)))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<FriendUserDTO> getPotentialFriends(User currentUser) {
        return userRepository.findPotentialFriends(currentUser.getId())
                .stream()
                .filter(this::isProfileVisible)
                .limit(12)
                .map(user -> new FriendUserDTO(
                        user,
                        friendRepository.findBetweenUsers(currentUser.getId(), user.getId())
                                .map(Friend::getStatus)
                                .orElse(null)))
                .toList();
    }

    private Friend getRequestForReceiver(User receiver, Long requestId) {
        Friend request = friendRepository.findById(requestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Friend request not found"));
        if (!request.getReceiver().getId().equals(receiver.getId()) || request.getStatus() != FriendshipStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only respond to requests sent to you");
        }
        return request;
    }
}
