package org.egov.user.web.contract;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourtUserSearchContent {
    
    private String userId;
    private String username;
    private String name;
    private String mobileNumber;
    private String emailId;
    private String courtRole;
    private String barNumber;
    private String courtJurisdiction;
    private String lawFirm;
}
