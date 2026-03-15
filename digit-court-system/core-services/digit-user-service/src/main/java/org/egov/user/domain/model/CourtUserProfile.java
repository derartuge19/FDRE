package org.egov.user.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourtUserProfile {
    
    private String id;
    private String userId;
    private String courtRole;
    private String barNumber;
    private String courtJurisdiction;
    private String licenseNumber;
    private String lawFirm;
    private Integer experienceYears;
    private String educationBackground;
    private String bio;
}
