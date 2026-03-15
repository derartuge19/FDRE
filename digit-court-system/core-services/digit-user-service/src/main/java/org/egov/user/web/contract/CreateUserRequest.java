package org.egov.user.web.contract;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import javax.validation.Valid;
import javax.validation.constraints.NotNull;

import org.egov.common.contract.request.RequestInfo;
import org.egov.user.domain.model.User;

@AllArgsConstructor
@Builder
@Getter
@Setter
@NoArgsConstructor
public class CreateUserRequest {
    private RequestInfo requestInfo;

    @NotNull
    @Valid
    private UserRequest user;

    private String barNumber;
    private String courtJurisdiction;
    private String licenseNumber;
    private String lawFirm;
    private Integer experienceYears;
    private String educationBackground;
    private String bio;

    public User toDomain(boolean isCreate) {
        return user.toDomain(loggedInUserId(), loggedInUserUuid(), isCreate);
    }

    // TODO Update libraries to have uuid in request info
    private Long loggedInUserId() {
        return requestInfo.getUserInfo() == null ? null : requestInfo.getUserInfo().getId();
    }

    private String loggedInUserUuid() {
        return requestInfo.getUserInfo() == null ? null : requestInfo.getUserInfo().getUuid();
    }

}
