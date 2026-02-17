// User types
export type UserRole = 'ADMIN' | 'USER' | 'MANAGER';

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    avatarUrl: string | null;
    jobTitle?: string | null;
    department?: string | null;
    bio?: string | null;
    phoneNumber?: string | null;
    vacationDaysTotal: number;
    vacationDaysUsed: number;
}

// Leave Request types
export type LeaveType = 'VACATION' | 'SICK' | 'PERSONAL';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface LeaveRequest {
    id: string;
    userId: string;
    startDate: string;
    endDate: string;
    type: LeaveType;
    status: LeaveStatus;
    reason?: string;
    createdAt: string;
    reviewedAt?: string;
    reviewedBy?: string;
}

export interface CreateLeaveRequest {
    startDate: string;
    endDate: string;
    type: LeaveType;
    reason?: string;
}
