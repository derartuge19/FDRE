package org.egov.user.web.contract;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.egov.common.contract.response.ResponseInfo;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourtLoginResponse {

    private ResponseInfo responseInfo;

    private String userId;
    private String username;
    private String name;
    private String mobileNumber;
    private String emailId;
    private String courtRole;
    private String barNumber;
    private String courtJurisdiction;
    private String token;
    
    private boolean requiresMFA;
}
