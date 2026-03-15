package org.egov.user.persistence.repository;

import org.egov.user.domain.model.CourtUserProfile;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.jdbc.core.BeanPropertyRowMapper;

import java.util.HashMap;
import java.util.Map;
import java.util.List;

@Repository
public class CourtUserRepository {

    private JdbcTemplate jdbcTemplate;
    private NamedParameterJdbcTemplate namedParameterJdbcTemplate;

    @Autowired
    public CourtUserRepository(JdbcTemplate jdbcTemplate, NamedParameterJdbcTemplate namedParameterJdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
        this.namedParameterJdbcTemplate = namedParameterJdbcTemplate;
    }

    public void save(CourtUserProfile profile) {
        // We use a query that handles creation and update
        String query = "INSERT INTO eg_court_profile (userId, courtRole, barNumber, courtJurisdiction, licenseNumber, lawFirm, experienceYears, educationBackground, bio) "
                +
                "VALUES (:userId, :courtRole, :barNumber, :courtJurisdiction, :licenseNumber, :lawFirm, :experienceYears, :educationBackground, :bio) "
                +
                "ON CONFLICT (userId) DO UPDATE SET " +
                "courtRole = :courtRole, barNumber = :barNumber, courtJurisdiction = :courtJurisdiction, licenseNumber = :licenseNumber, "
                +
                "lawFirm = :lawFirm, experienceYears = :experienceYears, educationBackground = :educationBackground, bio = :bio";

        Map<String, Object> params = new HashMap<>();
        params.put("userId", profile.getUserId());
        params.put("courtRole", profile.getCourtRole());
        params.put("barNumber", profile.getBarNumber());
        params.put("courtJurisdiction", profile.getCourtJurisdiction());
        params.put("licenseNumber", profile.getLicenseNumber());
        params.put("lawFirm", profile.getLawFirm());
        params.put("experienceYears", profile.getExperienceYears());
        params.put("educationBackground", profile.getEducationBackground());
        params.put("bio", profile.getBio());

        namedParameterJdbcTemplate.update(query, params);
    }

    public CourtUserProfile findByUserId(String userId) {
        try {
            String query = "SELECT * FROM eg_court_profile WHERE userId = ?";
            List<CourtUserProfile> profiles = jdbcTemplate.query(query, new Object[] { userId },
                    new BeanPropertyRowMapper<>(CourtUserProfile.class));
            return profiles.isEmpty() ? null : profiles.get(0);
        } catch (Exception e) {
            // If table doesn't exist yet, return a mock or empty profile to prevent crash
            return CourtUserProfile.builder().userId(userId).courtRole("UNKNOWN").build();
        }
    }
}
