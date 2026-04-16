const API_BASE_URL = 'http://localhost:3000';
const API_URL = `${API_BASE_URL}/api`;

const getAuthHeader = (): Record<string, string> => {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

interface LoginRequest {
  username: string;
  password: string;
}

interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'USER' | 'ADMIN' | 'DEVELOPER';
  steamId?: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface Game {
  id: number;
  sequenceNumber: number;
  title: string;
  author: string;
  coverUrl?: string;
  commentId?: number;
  rating?: number;
  genre: string;
  literaryForm: string;
  lyricNote?: string;
}

export interface Rating {
  id: number;
  userId: number;
  gameId: number;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

export interface GameRating {
  gameId: number;
  averageRating: number;
  totalRatings: number;
}

export class AuthService {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Bejelentkezés sikertelen');
    }

    return response.json();
  }

  async register(credentials: RegisterRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Regisztráció sikertelen');
    }

    return response.json();
  }

  async checkSteamKey(): Promise<{ hasKey: boolean }> {
    const response = await fetch(`${API_BASE_URL}/auth/steam/check-key`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    if (!response.ok) {
      return { hasKey: false };
    }

    return response.json();
  }

  async unlinkSteam(): Promise<{ message: string; user: User }> {
    const response = await fetch(`${API_BASE_URL}/auth/steam`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Steam leválasztása sikertelen');
    }

    return response.json();
  }
}

export class UsersService {
  async getAllUsers(): Promise<User[]> {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Felhasználók lekérése sikertelen');
    }

    return response.json();
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Felhasználó frissítése sikertelen');
    }

    return response.json();
  }

  async deleteUser(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Felhasználó törlése sikertelen');
    }
  }

  async createUser(data: Partial<User> & { password: string }): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Felhasználó létrehozása sikertelen');
    }

    return response.json();
  }
}

export class GamesService {
  async getAllGames(): Promise<Game[]> {
    const response = await fetch(`${API_BASE_URL}/games`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error('Játékok lekérése sikertelen');
    }

    return response.json();
  }

  async getGame(id: number): Promise<Game> {
    const response = await fetch(`${API_BASE_URL}/games/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error('Játék lekérése sikertelen');
    }

    return response.json();
  }

  async createGame(data: Partial<Game> & { title: string; author: string }): Promise<Game> {
    const response = await fetch(`${API_BASE_URL}/games`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Játék létrehozása sikertelen');
    }

    return response.json();
  }

  async updateGame(id: number, data: Partial<Game>): Promise<Game> {
    const response = await fetch(`${API_BASE_URL}/games/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Játék frissítése sikertelen');
    }

    return response.json();
  }

  async deleteGame(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/games/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error('Játék törlése sikertelen');
    }
  }
}

export interface Comment {
  id: number;
  content: string;
  userId: number;
  gameId: number;
  likes: number;
  dislikes: number;
  userVote: number; // 0: none, 1: like, -1: dislike
  user: {
    id: number;
    username: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentRequest {
  content: string;
  gameId: number;
}

export class CommentsService {
  async getGameComments(gameId: number): Promise<Comment[]> {
    const response = await fetch(`${API_URL}/comments/game/${gameId}`, {
      headers: getAuthHeader(),
    });

    if (!response.ok) {
      throw new Error('Kommentek lekérése sikertelen');
    }

    return response.json();
  }

  async createComment(gameId: number, content: string): Promise<Comment> {
    const response = await fetch(`${API_URL}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ gameId, content }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Komment hozzáadása sikertelen');
    }

    return response.json();
  }

  async updateComment(commentId: number, content: string): Promise<Comment> {
    const response = await fetch(`${API_URL}/comments/${commentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Komment frissítése sikertelen');
    }

    return response.json();
  }

  async deleteComment(commentId: number, userId?: number): Promise<void> {
    const query = userId ? `?userId=${encodeURIComponent(String(userId))}` : '';
    const response = await fetch(`${API_URL}/comments/${commentId}${query}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(userId ? { 'x-user-id': String(userId) } : {}),
        ...getAuthHeader(),
      },
      body: userId ? JSON.stringify({ userId }) : undefined,
    });

    if (!response.ok) {
      try {
        const error = await response.json();
        throw new Error(error.message || 'Komment törlése sikertelen');
      } catch {
        throw new Error('Komment törlése sikertelen');
      }
    }
  }

  async getUserComments(userId: number): Promise<Comment[]> {
    const response = await fetch(`${API_URL}/comments/user/${userId}`, {
      headers: getAuthHeader(),
    });

    if (!response.ok) {
      throw new Error('Felhasználó kommentjeinek lekérése sikertelen');
    }

    return response.json();
  }

  async voteComment(commentId: number, isLike: boolean | null): Promise<Comment> {
    const response = await fetch(`${API_URL}/comments/${commentId}/vote`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ isLike }),
    });

    if (!response.ok) {
      throw new Error('Komment szavazás sikertelen');
    }

    return response.json();
  }
}

export class RatingsService {
  async rateGame(userId: number, gameId: number, rating: number): Promise<Rating> {
    const response = await fetch(`${API_URL}/ratings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ userId, gameId, rating }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Értékelés hozzáadása sikertelen');
    }

    return response.json();
  }

  async getUserRating(userId: number, gameId: number): Promise<Rating | null> {
    const response = await fetch(`${API_URL}/ratings/user/${userId}/game/${gameId}`, {
      headers: getAuthHeader(),
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error('Felhasználó értékelésének lekérése sikertelen');
    }

    return response.json();
  }

  async getGameRating(gameId: number): Promise<GameRating> {
    const response = await fetch(`${API_URL}/ratings/game/${gameId}`, {
      headers: getAuthHeader(),
    });

    if (!response.ok) {
      throw new Error('Játék értékelésének lekérése sikertelen');
    }

    return response.json();
  }

  async getUserRatings(userId: number): Promise<Rating[]> {
    const response = await fetch(`${API_URL}/ratings/user/${userId}`, {
      headers: getAuthHeader(),
    });

    if (!response.ok) {
      throw new Error('Felhasználó értékelésének lekérése sikertelen');
    }

    return response.json();
  }
}

export interface SteamAchievement {
  apiName: string;
  name: string;
  description: string;
  icon: string;
  achieved: number;
  unlockTime: number;
}

export interface SteamAchievementsResponse {
  gameName: string;
  achievements: SteamAchievement[];
}

export class SteamService {
  async getGameAchievements(gameId: number): Promise<SteamAchievementsResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/steam/achievementsByGame/${gameId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error('Steam achievementek lekérése sikertelen');
    }

    return response.json();
  }
}




