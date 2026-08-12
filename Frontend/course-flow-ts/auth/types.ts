// types.tsx
export type Role = 'student' | 'advisor' | 'admin';

export interface User {
  userId: string;
  email: string;
  name: string;
  attributes: Record<string, any>;
  bio: string;
  major: string;
  photoURL: string;
  role?: Role; // 👈 add this
}


export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  ssoLogin: (universityId: string) => Promise<void>;
  logout: () => void;
}

export interface SAMLRequest {
  id: string;
  issueInstant: string;
  issuer: string;
  destination: string;
}