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
  createdAt: string;
  updatedAt: string;
}

interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface Book {
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
  bookId: number;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

export interface BookRating {
  bookId: number;
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

export class BooksService {
  async getAllBooks(): Promise<Book[]> {
    const response = await fetch(`${API_BASE_URL}/books`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error('Könyvek lekérése sikertelen');
    }

    return response.json();
  }

  async getBook(id: number): Promise<Book> {
    const response = await fetch(`${API_BASE_URL}/books/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error('Könyv lekérése sikertelen');
    }

    return response.json();
  }

  async createBook(data: Partial<Book> & { title: string; author: string }): Promise<Book> {
    const response = await fetch(`${API_BASE_URL}/books`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Könyv létrehozása sikertelen');
    }

    return response.json();
  }

  async updateBook(id: number, data: Partial<Book>): Promise<Book> {
    const response = await fetch(`${API_BASE_URL}/books/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Könyv frissítése sikertelen');
    }

    return response.json();
  }

  async deleteBook(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/books/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error('Könyv törlése sikertelen');
    }
  }
}

export interface Comment {
  id: number;
  content: string;
  userId: number;
  bookId: number;
  user: {
    id: number;
    username: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentRequest {
  content: string;
  bookId: number;
}

export class CommentsService {
  async getBookComments(bookId: number): Promise<Comment[]> {
    const response = await fetch(`${API_URL}/comments/book/${bookId}`, {
      headers: getAuthHeader(),
    });

    if (!response.ok) {
      throw new Error('Kommentek lekérése sikertelen');
    }

    return response.json();
  }

  async createComment(bookId: number, content: string): Promise<Comment> {
    const response = await fetch(`${API_URL}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ bookId, content }),
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
}

export class RatingsService {
  async rateBook(userId: number, bookId: number, rating: number): Promise<Rating> {
    const response = await fetch(`${API_URL}/ratings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ userId, bookId, rating }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Értékelés hozzáadása sikertelen');
    }

    return response.json();
  }

  async getUserRating(userId: number, bookId: number): Promise<Rating | null> {
    const response = await fetch(`${API_URL}/ratings/user/${userId}/book/${bookId}`, {
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

  async getBookRating(bookId: number): Promise<BookRating> {
    const response = await fetch(`${API_URL}/ratings/book/${bookId}`, {
      headers: getAuthHeader(),
    });

    if (!response.ok) {
      throw new Error('Könyv értékelésének lekérése sikertelen');
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
  async getGameAchievements(bookId: number): Promise<SteamAchievementsResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/steam/achievementsByBook/${bookId}`, {
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
