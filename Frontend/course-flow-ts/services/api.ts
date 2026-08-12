import axios, { InternalAxiosRequestConfig, AxiosHeaders } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ProfileDto} from "../app/(advisor)/(drawer)/advisees/advisee-details";

// Use your computer's IP for mobile testing, localhost for web
// On Android Emulator use 'http://10.0.2.2:8080/api'
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080/api';
const API_ROOT_URL =
    process.env.EXPO_PUBLIC_API_ROOT_URL ||
    API_BASE_URL.replace(/\/api\/?$/, '');

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' },
});

const attachAuthHeader = async (config: InternalAxiosRequestConfig) => {
    const token = await AsyncStorage.getItem('accessToken');

    if (token) {
        if (!config.headers) {
            config.headers = new AxiosHeaders();
        }
        // Force the header to be set
        (config.headers as AxiosHeaders).set('Authorization', `Bearer ${token}`);
    }
    return config;
};

const handleApiError = async (error: any) => {
    // Only clear storage on 401 (Session Expired), NOT 403 (Forbidden/Access Denied)
    if (error.response?.status === 401) {
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'userData']);
    }
    return Promise.reject(error);
};

api.interceptors.request.use(attachAuthHeader, (err) => Promise.reject(err));

// Handle 401/403 (Unauthorized/Forbidden)
api.interceptors.response.use(
    (res) => res,
    handleApiError
);

export const authAPI = {
  loginWithGoogle: async (payload: {
    code: string;
    platform: "web" | "mobile";
    deviceId?: string;
  }) => {
    const res = await api.post('/auth/google', payload);
    return res.data;
  },

  logout: async () => {
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'userData']);
  },
};

export const profileAPI = {
    getProfile: () => api.get('/profile/me').then(res => res.data),
    updateProfile: (body: any) => api.put('/profile/me', body).then(res => res.data),
};

export type FriendUser = {
    id: number;
    netid: string;
    email: string;
    name: string;
    firstName?: string;
    lastName?: string;
    photoUrl?: string;
    bio?: string;
    majors: string[];
    minors: string[];
    graduationYear?: string;
    friendshipStatus?: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'BLOCKED' | null;
};

export type FriendRequest = {
    id: number;
    status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'BLOCKED';
    sender: FriendUser;
    receiver: FriendUser;
    createdAt: string;
};

export const friendsAPI = {
    getFriends: () => api.get<FriendUser[]>('/friends').then(res => res.data),
    getPotentialFriends: () => api.get<FriendUser[]>('/friends/potential').then(res => res.data),
    searchUsers: (query: string) =>
        api.get<FriendUser[]>('/friends/search', { params: { query } }).then(res => res.data),
    getIncomingRequests: () =>
        api.get<FriendRequest[]>('/friends/requests/incoming').then(res => res.data),
    getOutgoingRequests: () =>
        api.get<FriendRequest[]>('/friends/requests/outgoing').then(res => res.data),
    sendRequest: (receiverId: number) =>
        api.post<FriendRequest>(`/friends/requests/${receiverId}`).then(res => res.data),
    acceptRequest: (requestId: number) =>
        api.post<FriendRequest>(`/friends/requests/${requestId}/accept`).then(res => res.data),
    rejectRequest: (requestId: number) =>
        api.delete(`/friends/requests/${requestId}/reject`).then(res => res.data),
    cancelRequest: (requestId: number) =>
        api.delete(`/friends/requests/${requestId}/cancel`).then(res => res.data),
    removeFriend: (friendUserId: number) =>
        api.delete(`/friends/${friendUserId}`).then(res => res.data),
};

export type CoursePlanCourse = {
    year: number | null;
    semester: string;
    code: string;
    name: string;
    credits: number;
    taken: boolean;
};

export type CoursePlan = {
    plan_id: number;
    plan_name: string;
    total_credits: number;
    list_of_courses?: CoursePlanCourse[];
};

export const coursePlanAPI = {
    getUserPlans: (netid: string) =>
        rootApi.get<CoursePlan[]>(`/coursePlan/${encodeURIComponent(netid)}/plans`).then(res => res.data),
};

// services/api.ts (or wherever profileAPI is)
function mapProfile(dto: ProfileDto) {
  return {
    id: dto.id,
    userId: dto.user_id,
    email: dto.email,
    netid: dto.netid,
    role: dto.role,
    bio: dto.bio ?? "",
    name: dto.display_name ?? dto.netid,
    graduationYear: dto.graduation_year ?? "",
    photoUrl: dto.photo_url ?? "",
  };
}

export const rootApi = axios.create({
  baseURL: API_ROOT_URL,
  headers: { "Content-Type": "application/json" },
});

// reuse same interceptor behavior
rootApi.interceptors.request.use(attachAuthHeader, (err) => Promise.reject(err));
rootApi.interceptors.response.use(
  (res) => res,
  handleApiError
);

export type BadgeEntry = {
  key: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  earned: boolean;
  earnedDate?: string;
};

export type BadgeSummary = {
  totalBadges: number;
  level: number;
  levelLabel: string;
  nextLevelAt: number;
  progressToNextLevel: number;
};

export const gamificationAPI = {
  getMyBadges: () => api.get<BadgeEntry[]>('/gamification/badges').then(res => res.data),
  getBadgesForUser: (userId: number) =>
    api.get<BadgeEntry[]>(`/gamification/user/${userId}/badges`).then(res => res.data),
  getNotifications: () =>
    api.get<BadgeEntry[]>('/gamification/notifications').then(res => res.data),
  getSummary: () => api.get<BadgeSummary>('/gamification/summary').then(res => res.data),
  evaluate: () => api.post('/gamification/evaluate').then(res => res.data),
};

export default api;
