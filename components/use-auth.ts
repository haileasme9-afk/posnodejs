'use client';

import { useEffect, useState } from 'react';
import { api, Me } from '@/lib/api';

export function useAuth() {
    const [me, setMe] = useState<Me | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get<Me>('/api/auth')
            .then((data) => setMe(data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    return { me, loading };
}