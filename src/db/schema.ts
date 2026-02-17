import { pgTable, uuid, varchar, integer, timestamp, pgEnum, text, date } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['ADMIN', 'USER', 'MANAGER']);
export const leaveTypeEnum = pgEnum('leave_type', ['VACATION', 'SICK', 'PERSONAL']);
export const leaveStatusEnum = pgEnum('leave_status', ['PENDING', 'APPROVED', 'REJECTED']);

// Users table
export const users = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    password: varchar('password', { length: 255 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    role: userRoleEnum('role').default('USER').notNull(),
    vacationDaysTotal: integer('vacation_days_total').default(22).notNull(),
    vacationDaysUsed: integer('vacation_days_used').default(0).notNull(),
    avatarUrl: text('avatar_url'),
    jobTitle: varchar('job_title', { length: 255 }),
    department: varchar('department', { length: 255 }),
    bio: text('bio'),
    phoneNumber: varchar('phone_number', { length: 50 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Leave requests table
export const leaveRequests = pgTable('leave_requests', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
    type: leaveTypeEnum('type').notNull(),
    status: leaveStatusEnum('status').default('PENDING').notNull(),
    reason: text('reason'),
    handoverNotes: text('handover_notes'),
    reviewedBy: uuid('reviewed_by').references(() => users.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
    leaveRequests: many(leaveRequests, { relationName: 'userLeaveRequests' }),
    reviewedRequests: many(leaveRequests, { relationName: 'reviewerLeaveRequests' }),
}));

export const leaveRequestsRelations = relations(leaveRequests, ({ one }) => ({
    user: one(users, {
        fields: [leaveRequests.userId],
        references: [users.id],
        relationName: 'userLeaveRequests',
    }),
    reviewer: one(users, {
        fields: [leaveRequests.reviewedBy],
        references: [users.id],
        relationName: 'reviewerLeaveRequests',
    }),
}));

// TypeScript types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type LeaveRequest = typeof leaveRequests.$inferSelect;
export type NewLeaveRequest = typeof leaveRequests.$inferInsert;
