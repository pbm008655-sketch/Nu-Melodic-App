// server/storage.ts - Additional PayPal Methods
// Add these methods to your existing storage.ts file

import { eq } from "drizzle-orm";
import { db } from "./db.js";
import { users } from "../shared/schema.js";

/**
 * Update user premium status and PayPal subscription info
 */
export async function updateUserPremium(
  userId: number, 
  premiumData: {
    isPremium: boolean;
    premiumExpiry?: Date;
    paypalSubscriptionId?: string;
  }
) {
  const updateData: any = {
    isPremium: premiumData.isPremium,
  };

  if (premiumData.premiumExpiry) {
    updateData.premiumExpiry = premiumData.premiumExpiry;
  }

  if (premiumData.paypalSubscriptionId !== undefined) {
    updateData.paypalSubscriptionId = premiumData.paypalSubscriptionId;
  }

  const result = await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, userId))
    .returning();

  return result[0];
}

/**
 * Update user's PayPal subscription ID
 */
export async function updateUserPayPalSubscription(
  userId: number, 
  subscriptionId: string | null
) {
  const result = await db
    .update(users)
    .set({ paypalSubscriptionId: subscriptionId })
    .where(eq(users.id, userId))
    .returning();

  return result[0];
}

/**
 * Find user by PayPal subscription ID
 */
export async function getUserByPayPalSubscriptionId(subscriptionId: string) {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.paypalSubscriptionId, subscriptionId))
    .limit(1);

  return result[0] || null;
}

/**
 * Get user by ID with full details
 */
export async function getUserById(userId: number) {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return result[0] || null;
}

/**
 * Check and update expired premium subscriptions
 * Call this periodically (e.g., daily cron job)
 */
export async function updateExpiredPremiumUsers() {
  const now = new Date();
  
  const expiredUsers = await db
    .update(users)
    .set({ 
      isPremium: false,
      // Keep the expiry date for records, but remove active subscription
    })
    .where(
      and(
        eq(users.isPremium, true),
        lt(users.premiumExpiry, now)
      )
    )
    .returning({ id: users.id, username: users.username });

  console.log(`Updated ${expiredUsers.length} expired premium users:`, expiredUsers);
  return expiredUsers;
}

/**
 * Get all premium users for analytics
 */
export async function getPremiumUsersCount() {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(eq(users.isPremium, true));

  return result[0].count;
}

/**
 * Get subscription analytics
 */
export async function getSubscriptionAnalytics() {
  // Total users
  const totalUsersResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(users);

  // Premium users
  const premiumUsersResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(eq(users.isPremium, true));

  // PayPal subscribers
  const paypalUsersResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(
      and(
        eq(users.isPremium, true),
        isNotNull(users.paypalSubscriptionId)
      )
    );

  // Stripe subscribers  
  const stripeUsersResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(
      and(
        eq(users.isPremium, true),
        isNotNull(users.stripeCustomerId)
      )
    );

  return {
    totalUsers: totalUsersResult[0].count,
    premiumUsers: premiumUsersResult[0].count,
    paypalSubscribers: paypalUsersResult[0].count,
    stripeSubscribers: stripeUsersResult[0].count,
    conversionRate: (premiumUsersResult[0].count / totalUsersResult[0].count) * 100,
  };
}