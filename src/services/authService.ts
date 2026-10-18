import { API_PATHS } from '../constants/apiPaths'
import type { User } from '../types/user'
import { request } from './httpClient'

export const authService = {
  login(email: string, password: string): Promise<{ user: { id: string } }> {
    return request(API_PATHS.login, { method: 'POST', body: JSON.stringify({ email, password }) })
  },
  logout(): Promise<void> {
    return request(API_PATHS.logout, { method: 'POST' })
  },
  me(): Promise<{ user: User }> {
    return request(API_PATHS.me)
  },
}