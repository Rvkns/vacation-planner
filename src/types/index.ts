// User types
export type UserRole = 'ADMIN' | 'USER' | 'MANAGER';

export interface User {
    id: string;
    name: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    avatarUrl: string | null;
    jobTitle?: string | null;
    department?: string | null;
    bio?: string | null;
    phoneNumber?: string | null;
    vacationDaysTotal: number;
    vacationDaysUsed: number;
    personalHoursTotal: number;
    personalHoursUsed: number;
}

// Leave Request types
export type LeaveType = 'VACATION' | 'SICK' | 'PERSONAL';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface LeaveRequest {
    id: string;
    userId: string;
    startDate: string; // ISO date string
    endDate: string; // ISO date string
    startTime?: string | null; // HH:mm
    endTime?: string | null; // HH:mm
    type: LeaveType;
    status: LeaveStatus;
    reason?: string | null;
    handoverNotes?: string | null;
    reviewedBy?: string | null;
    createdAt: Date;
    user?: User; // Joined user data
}

export interface CreateLeaveRequest {
    startDate: string;
    endDate: string;
    startTime?: string;
    endTime?: string;
    type: LeaveType;
    reason?: string;
}
