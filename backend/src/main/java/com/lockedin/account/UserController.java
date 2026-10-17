package com.lockedin.account;

import com.lockedin.account.dto.UpdateProfileRequest;
import com.lockedin.account.dto.UserProfileResponse;
import com.lockedin.common.CurrentUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/users")
@Tag(name = "Users & profiles")
public class UserController {

    private final UserService userService;
    private final CurrentUser currentUser;

    public UserController(UserService userService, CurrentUser currentUser) {
        this.userService = userService;
        this.currentUser = currentUser;
    }

    @GetMapping("/me")
    @Operation(summary = "Your profile, with streaks, badges and past MVP/Chud titles")
    public UserProfileResponse me() {
        return userService.profile(currentUser.id(), true);
    }

    @PatchMapping("/me")
    @Operation(summary = "Update your profile. Only send the fields you want to change.")
    public UserProfileResponse updateMe(@Valid @RequestBody UpdateProfileRequest request) {
        return userService.update(currentUser.id(), request);
    }

    @GetMapping("/{userId}")
    @Operation(summary = "Someone else's profile (no email)")
    public UserProfileResponse get(@PathVariable Long userId) {
        currentUser.id(); // must be logged in
        return userService.profile(userId, false);
    }
}
