import useSWR from 'swr';
import { User, LeaveRequest } from '@/types';

const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error('An error occurred while fetching the data.');
    }
    return res.json();
};

export function useUsers() {
    const { data, error, isLoading, mutate } = useSWR<User[]>('/api/users', fetcher, {
        revalidateOnFocus: false,
        dedupingInterval: 60000, // 1 minute
    });

    return {
        users: data || [],
        isLoading,
        isError: error,
        mutateUsers: mutate,
    };
}

export function useLeaveRequests() {
    const { data, error, isLoading, mutate } = useSWR<LeaveRequest[]>('/api/leave-requests', fetcher, {
        revalidateOnFocus: false,
        dedupingInterval: 10000, // 10 seconds
    });

    return {
        leaveRequests: data || [],
        isLoading,
        isError: error,
        mutateLeaveRequests: mutate,
    };
}

export function useCurrentUser() {
    const { data, error, isLoading, mutate } = useSWR<User>('/api/users/me', fetcher, {
        revalidateOnFocus: false,
        dedupingInterval: 60000,
    });

    return {
        currentUser: data,
        isLoading,
        isError: error,
        mutateCurrentUser: mutate,
    };
}
