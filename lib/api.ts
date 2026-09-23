export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
}

async function request<T = any>(path: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(path, {
        credentials: 'same-origin',
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        },
    });
    let data: ApiResponse<T> | null = null;
    try {
        data = (await res.json()) as ApiResponse<T>;
    } catch {
        data = null;
    }
    if (res.status === 401) {
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
            window.location.href = '/login';
        }
        throw new Error('Not authenticated');
    }
    if (!res.ok || !data?.success) {
        throw new Error(data?.error || `Request failed (${res.status})`);
    }
    return data.data as T;
}

export const api = {
    get<T = any>(path: string) {
        return request<T>(path);
    },
    post<T = any>(path: string, body?: unknown) {
        return request<T>(path, {
            method: 'POST',
            body: body != null ? JSON.stringify(body) : undefined,
        });
    },
    put<T = any>(path: string, body?: unknown) {
        return request<T>(path, {
            method: 'PUT',
            body: body != null ? JSON.stringify(body) : undefined,
        });
    },
    del<T = any>(path: string) {
        return request<T>(path, { method: 'DELETE' });
    },
};

export type Me = {
    id: number;
    username: string;
    full_name: string;
    role: string;
    role_id: number | null;
};