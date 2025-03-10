import { request } from './request.ts';

export type Token = {
  /**
   * token id like woc-{user.id}-{token.id}
   */
  id: string;

  /**
   * user who owns the token
   */
  user_id: string;

  /**
   * token expiration timestamp
   */
  expires: number;

  /**
   * token is revoked
   */
  revoked: boolean;

  /**
   * request_ip is the IP address of the request
   */
  request_ip?: string;

  /**
   * user_agent is the User-Agent header of the request
   */
  user_agent?: string;

  /**
   * token type, like session, api, etc.
   */
  token_type?: string;
};

/**
 * OneTimeCode is a token that can be used only once. It can not access APIs.
 * Here id is the code itself (22-char short uuid), user_id is the provider_id.
 */
export type OneTimeCode = Token & {
  /**
   * provider_id is like email|hrz6976@hotmail.com, phone|1234567890, github|12345678. It must be unique
   */
  provider_id: string;
};

export type User = {
  /**
   * id is a short uuid like edF8BXKwqjzLdT4ECVRoMe
   */
  id: string;

  /**
   * name is the user's full name. user can change it
   */
  name: string;

  /**
   * provider_id is like email|hrz6976@hotmail.com, phone|1234567890, github|12345678. It must be unique
   */
  provider_id: string;
};

/**
 * Get the current user's information
 */
export const getUser = async () => await request<User>('/auth/user', 'GET');

/**
 * Get tokens belonging to the current user
 */
export const getUserTokens = async (token_type?: 'session' | 'api' | null) =>
  await request<Token[]>('/auth/token', 'GET', { token_type });

/**
 * Create a new API token for the current user
 */
export const createToken = async () =>
  await request<Token>('/auth/token', 'POST');

/**
 * Revoke a token by its ID
 */
export const revokeToken = async (token_id: string) =>
  await request<void>(`/auth/token/${token_id}`, 'DELETE');

export const sendVerificationEmail = async (
  email: string,
  cf_turnstile_response: string
) =>
  await request<void>(`/auth/email/login`, 'GET', {
    email,
    cf_turnstile_response
  });
