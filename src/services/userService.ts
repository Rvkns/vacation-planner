// User Service - Updated to use API
class UserService {
    async getAllUsers() {
        const response = await fetch('/api/users');
        if (!response.ok) throw new Error('Failed to fetch users');
        return response.json();
    }

    async getUserById(id: string) {
        const users = await this.getAllUsers();
        return users.find((u: any) => u.id === id);
    }
}

export const userService = new UserService();
