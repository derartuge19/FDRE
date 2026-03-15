package org.egov.user.domain.service;

import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.egov.user.domain.exception.InvalidAccessTokenException;
import org.egov.user.domain.model.SecureUser;
import org.egov.user.domain.model.UserDetail;
import org.egov.user.persistence.repository.ActionRestRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.provider.OAuth2Authentication;
import org.springframework.security.oauth2.provider.token.TokenStore;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class TokenService {

    private TokenStore tokenStore;

    private ActionRestRepository actionRestRepository;

    @Value("${roles.state.level.enabled}")
    private boolean isRoleStateLevel;

    private TokenService(TokenStore tokenStore, ActionRestRepository actionRestRepository) {
        this.tokenStore = tokenStore;
        this.actionRestRepository = actionRestRepository;
    }

    /**
     * Get UserDetails By AccessToken
     *
     * @param accessToken
     * @return
     */
    public UserDetail getUser(String accessToken) {
        if (StringUtils.isEmpty(accessToken)) {
            throw new InvalidAccessTokenException();
        }

        OAuth2Authentication authentication = tokenStore.readAuthentication(accessToken);

        if (authentication == null) {
            throw new InvalidAccessTokenException();
        }

        SecureUser secureUser = ((SecureUser) authentication.getPrincipal());
        return new UserDetail(secureUser, null);
    }

    /**
     * Generate AccessToken for User
     *
     * @param user
     * @return
     */
    public String generateToken(org.egov.user.domain.model.User user) {
        // In a real eGov system, this would involve OAuth2 flow.
        // For now, we generate a unique token that can be used in the UI.
        return java.util.UUID.randomUUID().toString();
    }
}