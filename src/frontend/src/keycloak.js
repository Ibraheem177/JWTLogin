import Keycloak from 'keycloak-js';

export const keycloakUrl = (process.env.REACT_APP_KEYCLOAK_URL || 'http://localhost:8080').replace(/\/$/, '');
export const keycloakRealm = 'ITCJWTRealm';
export const keycloakClientId = 'ReactClient';
export const keycloakTokenUrl = `${keycloakUrl}/realms/${keycloakRealm}/protocol/openid-connect/token`;

const keycloak = new Keycloak({
    url: keycloakUrl,
    realm: keycloakRealm,
    clientId: keycloakClientId
});

export default keycloak;