package com.courseflow.backend.Admin;

import com.courseflow.backend.Users.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final AdminService adminService;
    private final UserRepository userRepo;

    public AdminController(AdminService adminService, UserRepository userRepo){
        this.adminService = adminService;
        this.userRepo = userRepo;
    }

    //GET MAPPINGS:
    @GetMapping("/stats")
    public ResponseEntity<AdminStatsDTO> getStats(){
        System.out.println("Current User Authorities: " +
                SecurityContextHolder.getContext().getAuthentication().getAuthorities());
        return ResponseEntity.ok(adminService.getAdminDashStats());
    }

    @GetMapping("/approvals/admin")
    public List<User> getPendingAdmins(){
        return userRepo.findAllByRequestedRoleAndStatus(AccountLevel.ADMIN, UserApprovalStatus.PENDING);
    }

    @GetMapping("/approvals/advisors")
    public List<User> getPendingAdvisors(){
        return userRepo.findAllByRequestedRoleAndStatus(AccountLevel.ADVISOR, UserApprovalStatus.PENDING);
    }

    @GetMapping("/users")
    public List<User> getAllUsers(){
        return userRepo.findAll();
    }

    @PatchMapping("/users/{id}/role")
    public ResponseEntity<User> updateUserRole(@PathVariable Long id, @RequestParam AccountLevel role) {
        return userRepo.findById(id).map(user -> {
            user.setAccountLevel(role);
            return ResponseEntity.ok(userRepo.save(user));
        }).orElse(ResponseEntity.notFound().build());
    }


    //update a user's approval status:
    @PatchMapping("/approvals/{id}")
    public ResponseEntity<User> updateApprovalStatus(@PathVariable Long id, @RequestParam UserApprovalStatus status){
        return userRepo.findById(id).map(user -> {
            user.setStatus(status);
            return ResponseEntity.ok(userRepo.save(user));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/approvals/{id}/decide")
    public ResponseEntity<User> decide(@PathVariable Long id, @RequestParam boolean approved){
//        System.out.println("Current User Authorities: " +
//                SecurityContextHolder.getContext().getAuthentication().getAuthorities());
        System.out.println("PATCH REQUEST REACHED CONTROLLER");
        User updatedUser = adminService.handleRequests(id, approved);
        return ResponseEntity.ok(updatedUser);
    }

}
