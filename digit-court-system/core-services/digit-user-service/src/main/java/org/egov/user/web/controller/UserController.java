package org.egov.user.web.controller;

import lombok.extern.slf4j.Slf4j;
import org.egov.common.contract.response.ResponseInfo;
import org.egov.user.domain.model.*;

import org.apache.commons.lang3.StringUtils;
import org.egov.common.contract.response.ResponseInfo;
import org.egov.tracer.model.CustomException;
import org.egov.user.domain.model.User;
import org.egov.user.domain.model.UserDetail;
import org.egov.user.domain.model.UserSearchCriteria;
import org.egov.user.domain.service.TokenService;
import org.egov.user.domain.service.UserService;
import org.egov.user.web.contract.*;
import org.egov.user.web.contract.auth.CustomUserDetails;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import javax.validation.Valid;

import static org.egov.tracer.http.HttpUtils.isInterServiceCall;
import static org.springframework.util.CollectionUtils.isEmpty;

@RestController
@Slf4j
public class UserController {

    private UserService userService;
    private TokenService tokenService;

    @Value("${mobile.number.validation.workaround.enabled}")
    private String mobileValidationWorkaroundEnabled;

    @Value("${otp.validation.register.mandatory}")
    private boolean IsValidationMandatory;

    @Value("${citizen.registration.withlogin.enabled}")
    private boolean isRegWithLoginEnabled;

    @Value("${egov.user.search.default.size}")
    private Integer defaultSearchSize;

    @Autowired
    public UserController(UserService userService, TokenService tokenService) {
        this.userService = userService;
        this.tokenService = tokenService;
    }

    /**
     * end-point to create the citizen with otp.Here otp is mandatory to create
     * citizen.
     *
     * @param createUserRequest
     * @return
     */
    @PostMapping("/citizen/_create")
    public Object createCitizen(@RequestBody @Valid CreateUserRequest createUserRequest) {
        log.info("Received Citizen Registration Request  " + createUserRequest);
        User user = createUserRequest.toDomain(true);
        user.setOtpValidationMandatory(IsValidationMandatory);
        if (isRegWithLoginEnabled) {
            Object object = userService.registerWithLogin(user, createUserRequest.getRequestInfo());
            return new ResponseEntity<>(object, HttpStatus.OK);
        }
        User createdUser = userService.createCitizen(user, createUserRequest.getRequestInfo());
        return createResponse(createdUser);
    }

    /**
     * end-point to create the user without otp validation.
     *
     * @param createUserRequest
     * @param headers
     * @return
     */
    @PostMapping("/users/_createnovalidate")
    public UserDetailResponse createUserWithoutValidation(@RequestBody @Valid CreateUserRequest createUserRequest,
            @RequestHeader HttpHeaders headers) {

        User user = createUserRequest.toDomain(true);
        user.setMobileValidationMandatory(isMobileValidationRequired(headers));
        user.setOtpValidationMandatory(false);
        final User newUser = userService.createUser(user, createUserRequest.getRequestInfo());
        return createResponse(newUser);
    }

    /**
     * end-point to search the users by providing userSearchRequest. In Request
     * if there is no active filed value, it will fetch only active users
     *
     * @param request
     * @return
     */
    @PostMapping("/_search")
    public UserSearchResponse get(@RequestBody @Valid UserSearchRequest request, @RequestHeader HttpHeaders headers) {

        log.info("Received User search Request  " + request);
        if (request.getActive() == null) {
            request.setActive(true);
        }
        return searchUsers(request, headers);
    }

    /**
     * end-point to search the users by providing userSearchRequest. In Request
     * if there is no active filed value, it will fetch all(active & inactive)
     * users.
     *
     * @param request
     * @return
     */
    @PostMapping("/v1/_search")
    public UserSearchResponse getV1(@RequestBody UserSearchRequest request, @RequestHeader HttpHeaders headers) {
        return searchUsers(request, headers);
    }

    /**
     * end-point to fetch the user details by access-token
     *
     * @param accessToken
     * @return
     */
    @PostMapping("/_details")
    public CustomUserDetails getUser(@RequestParam(value = "access_token") String accessToken) {
        final UserDetail userDetail = tokenService.getUser(accessToken);
        return new CustomUserDetails(userDetail);
        // no encrypt/decrypt
    }

    /**
     * end-point to update the user details without otp validations.
     *
     * @param createUserRequest
     * @param headers
     * @return
     */
    @PostMapping("/users/_updatenovalidate")
    public UpdateResponse updateUserWithoutValidation(@RequestBody final @Valid CreateUserRequest createUserRequest,
            @RequestHeader HttpHeaders headers) {
        User user = createUserRequest.toDomain(false);
        user.setMobileValidationMandatory(isMobileValidationRequired(headers));
        final User updatedUser = userService.updateWithoutOtpValidation(user, createUserRequest.getRequestInfo());
        return createResponseforUpdate(updatedUser);
    }

    /**
     * end-point to update user profile.
     *
     * @param createUserRequest
     * @return
     */
    @PostMapping("/profile/_update")
    public UpdateResponse patch(@RequestBody final @Valid CreateUserRequest createUserRequest) {
        log.info("Received Profile Update Request  " + createUserRequest);
        User user = createUserRequest.toDomain(false);
        final User updatedUser = userService.partialUpdate(user, createUserRequest.getRequestInfo());
        return createResponseforUpdate(updatedUser);
    }

    private UserDetailResponse createResponse(User newUser) {
        UserRequest userRequest = new UserRequest(newUser);
        ResponseInfo responseInfo = ResponseInfo.builder().status(String.valueOf(HttpStatus.OK.value())).build();
        return new UserDetailResponse(responseInfo, Collections.singletonList(userRequest));
    }

    private UpdateResponse createResponseforUpdate(User newUser) {
        UpdateRequest updateRequest = new UpdateRequest(newUser);
        ResponseInfo responseInfo = ResponseInfo.builder().status(String.valueOf(HttpStatus.OK.value())).build();
        return new UpdateResponse(responseInfo, Collections.singletonList(updateRequest));
    }

    private UserSearchResponse searchUsers(@RequestBody UserSearchRequest request, HttpHeaders headers) {

        UserSearchCriteria searchCriteria = request.toDomain();

        if (!isInterServiceCall(headers)) {
            if ((isEmpty(searchCriteria.getId()) && isEmpty(searchCriteria.getUuid()))
                    && (searchCriteria.getLimit() > defaultSearchSize
                            || searchCriteria.getLimit() == 0))
                searchCriteria.setLimit(defaultSearchSize);
        }

        List<User> userModels = userService.searchUsers(searchCriteria, isInterServiceCall(headers),
                request.getRequestInfo());
        List<UserSearchResponseContent> userContracts = userModels.stream().map(UserSearchResponseContent::new)
                .collect(Collectors.toList());
        ResponseInfo responseInfo = ResponseInfo.builder().status(String.valueOf(HttpStatus.OK.value())).build();
        return new UserSearchResponse(responseInfo, userContracts);
    }

    /**
     * end-point to create court user with specific court roles
     *
     * @param createUserRequest
     * @return
     */
    @PostMapping("/court/_create")
    public UserDetailResponse createCourtUser(@RequestBody @Valid CreateUserRequest createUserRequest) {
        log.info("Received Court User Registration Request  " + createUserRequest);
        User user = createUserRequest.toDomain(true);
        user.setOtpValidationMandatory(false); // Disable OTP for court users
        user.setMobileValidationMandatory(true);

        // Validate court-specific fields
        validateCourtUser(user);

        User createdUser = userService.createUser(user, createUserRequest.getRequestInfo());

        // Create court user profile
        createCourtUserProfile(createdUser, createUserRequest);

        return createResponse(createdUser);
    }

    /**
     * end-point to authenticate court user
     *
     * @param loginRequest
     * @return
     */
    @PostMapping("/court/_login")
    public ResponseEntity<CourtLoginResponse> loginCourtUser(@RequestBody @Valid CourtLoginRequest loginRequest) {
        log.info("Received Court Login Request  " + loginRequest);

        // Authenticate user
        User user = userService.authenticate(loginRequest.getUsername(), loginRequest.getPassword());

        if (user == null) {
            throw new CustomException("INVALID_CREDENTIALS", "Invalid username or password");
        }

        // Logic for Judicial MFA
        if (StringUtils.isEmpty(loginRequest.getMfaCode())) {
            CourtLoginResponse response = CourtLoginResponse.builder()
                    .requiresMFA(true)
                    .build();
            ResponseInfo responseInfo = ResponseInfo.builder().status(String.valueOf(HttpStatus.OK.value())).build();
            response.setResponseInfo(responseInfo);
            return new ResponseEntity<>(response, HttpStatus.OK);
        }

        // Validate MFA Code (Mocking 123456 as valid for now)
        if (!"123456".equals(loginRequest.getMfaCode())) {
            throw new CustomException("INVALID_MFA", "Multipoint Authentication sequence failed");
        }

        // Generate JWT token
        String token = tokenService.generateToken(user);

        // Get court profile
        CourtUserProfile profile = fetchCourtUserProfile(user.getUuid());

        CourtLoginResponse response = CourtLoginResponse.builder()
                .userId(user.getUuid())
                .username(user.getUsername())
                .name(user.getName())
                .mobileNumber(user.getMobileNumber())
                .emailId(user.getEmailId())
                .courtRole(profile != null ? profile.getCourtRole() : "CITIZEN")
                .barNumber(profile != null ? profile.getBarNumber() : null)
                .courtJurisdiction(profile != null ? profile.getCourtJurisdiction() : null)
                .token(token)
                .requiresMFA(false)
                .build();

        ResponseInfo responseInfo = ResponseInfo.builder().status(String.valueOf(HttpStatus.OK.value())).build();
        response.setResponseInfo(responseInfo);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    /**
     * end-point to get court user profile
     *
     * @param userId
     * @return
     */
    @GetMapping("/court/profile/{userId}")
    public ResponseEntity<CourtUserProfileResponse> getCourtUserProfile(@PathVariable String userId) {
        log.info("Received Court Profile Request for userId: " + userId);

        User user = userService.getUserById(userId);
        if (user == null) {
            throw new CustomException("USER_NOT_FOUND", "User not found with id: " + userId);
        }

        CourtUserProfile profile = fetchCourtUserProfile(userId);

        CourtUserProfileResponse response = CourtUserProfileResponse.builder()
                .userId(user.getUuid())
                .username(user.getUsername())
                .name(user.getName())
                .mobileNumber(user.getMobileNumber())
                .emailId(user.getEmailId())
                .courtRole(profile.getCourtRole())
                .barNumber(profile.getBarNumber())
                .courtJurisdiction(profile.getCourtJurisdiction())
                .licenseNumber(profile.getLicenseNumber())
                .lawFirm(profile.getLawFirm())
                .experienceYears(profile.getExperienceYears())
                .educationBackground(profile.getEducationBackground())
                .bio(profile.getBio())
                .build();

        ResponseInfo responseInfo = ResponseInfo.builder().status(String.valueOf(HttpStatus.OK.value())).build();
        response.setResponseInfo(responseInfo);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    /**
     * end-point to search court users by role
     *
     * @param courtRole
     * @return
     */
    @GetMapping("/court/role/{courtRole}")
    public ResponseEntity<CourtUserSearchResponse> searchCourtUsersByRole(@PathVariable String courtRole) {
        log.info("Received Court User Search Request for role: " + courtRole);

        List<User> users = userService.searchUsersByRole(courtRole);
        List<CourtUserSearchContent> courtUsers = users.stream()
                .map(user -> {
                    CourtUserProfile profile = fetchCourtUserProfile(user.getUuid());
                    return CourtUserSearchContent.builder()
                            .userId(user.getUuid())
                            .username(user.getUsername())
                            .name(user.getName())
                            .mobileNumber(user.getMobileNumber())
                            .emailId(user.getEmailId())
                            .courtRole(profile.getCourtRole())
                            .barNumber(profile.getBarNumber())
                            .courtJurisdiction(profile.getCourtJurisdiction())
                            .lawFirm(profile.getLawFirm())
                            .build();
                })
                .collect(Collectors.toList());

        ResponseInfo responseInfo = ResponseInfo.builder().status(String.valueOf(HttpStatus.OK.value())).build();
        return new ResponseEntity<>(new CourtUserSearchResponse(responseInfo, courtUsers), HttpStatus.OK);
    }

    private void validateCourtUser(User user) {
        // Validate court role
        if (user.getRoles() == null || user.getRoles().isEmpty()) {
            throw new CustomException("INVALID_ROLE", "Court role is required");
        }

        String courtRole = user.getRoles().iterator().next().getCode();
        if (!isValidCourtRole(courtRole)) {
            throw new CustomException("INVALID_ROLE", "Invalid court role: " + courtRole);
        }

        // Validate mobile number for all court users
        if (StringUtils.isEmpty(user.getMobileNumber())) {
            throw new CustomException("INVALID_MOBILE", "Mobile number is required for court users");
        }
    }

    private boolean isValidCourtRole(String role) {
        return role.equals("JUDGE") || role.equals("LAWYER") || role.equals("PLAINTIFF") ||
                role.equals("DEFENDANT") || role.equals("CLERK") || role.equals("REGISTRAR") ||
                role.equals("ADMIN");
    }

    private void createCourtUserProfile(User user, CreateUserRequest request) {
        // Create court user profile based on role
        CourtUserProfile profile = CourtUserProfile.builder()
                .userId(user.getUuid())
                .courtRole(user.getRoles().iterator().next().getCode())
                .barNumber(request.getBarNumber())
                .courtJurisdiction(request.getCourtJurisdiction())
                .licenseNumber(request.getLicenseNumber())
                .lawFirm(request.getLawFirm())
                .experienceYears(request.getExperienceYears())
                .educationBackground(request.getEducationBackground())
                .bio(request.getBio())
                .build();

        userService.saveCourtUserProfile(profile);
    }

    private CourtUserProfile fetchCourtUserProfile(String userId) {
        return userService.getCourtUserProfile(userId);
    }

    private boolean isMobileValidationRequired(HttpHeaders headers) {
        boolean x_pass_through_gateway = !isInterServiceCall(headers);
        if (mobileValidationWorkaroundEnabled != null && Boolean.valueOf(mobileValidationWorkaroundEnabled)
                && !x_pass_through_gateway) {
            return false;
        }
        return true;
    }

}
