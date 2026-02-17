import { LeaveRequest, CreateLeaveRequest, LeaveStatus } from '@/types';

// Leave Service - Updated to use API
class LeaveService {
    async getAllRequests(): Promise<LeaveRequest[]> {
        const response = await fetch('/api/leave-requests');
        if (!response.ok) throw new Error('Failed to fetch leave requests');
        return response.json();
    }

    async getRequestsByUserId(userId: string): Promise<LeaveRequest[]> {
        const response = await fetch(`/api/leave-requests?userId=${userId}`);
        if (!response.ok) throw new Error('Failed to fetch leave requests');
        return response.json();
    }

    async getPendingRequests(): Promise<LeaveRequest[]> {
        const response = await fetch('/api/leave-requests?status=PENDING');
        if (!response.ok) throw new Error('Failed to fetch pending requests');
        return response.json();
    }

    async getApprovedRequests(): Promise<LeaveRequest[]> {
        const response = await fetch('/api/leave-requests?status=APPROVED');
        if (!response.ok) throw new Error('Failed to fetch approved requests');
        return response.json();
    }

    async createRequest(userId: string, data: CreateLeaveRequest): Promise<LeaveRequest> {
        const response = await fetch('/api/leave-requests', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to create leave request');
        return response.json();
    }

    async updateRequestStatus(requestId: string, status: LeaveStatus): Promise<LeaveRequest> {
        const response = await fetch(`/api/leave-requests/${requestId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
        });
        if (!response.ok) throw new Error('Failed to update leave request');
        return response.json();
    }

    async deleteRequest(requestId: string): Promise<boolean> {
        const response = await fetch(`/api/leave-requests/${requestId}`, {
            method: 'DELETE',
        });
        return response.ok;
    }

    calculateDays(startDate: string, endDate: string): number {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays;
    }

    async getRequestsInDateRange(startDate: string, endDate: string): Promise<LeaveRequest[]> {
        const requests = await this.getApprovedRequests();
        const start = new Date(startDate);
        const end = new Date(endDate);

        return requests.filter((request: LeaveRequest) => {
            const reqStart = new Date(request.startDate);
            const reqEnd = new Date(request.endDate);

            return (reqStart <= end && reqEnd >= start);
        });
    }
}

export const leaveService = new LeaveService();
