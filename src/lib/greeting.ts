/**
 * Time-Based Greeting Helper
 * 
 * Provides time-based personalized greetings for users.
 * Designed for use in both server and client components.
 */

export function getTimeBasedGreeting(name?: string | null, hour?: number): string {
  // Use provided hour or current browser/server time
  const currentHour = hour ?? new Date().getHours()

  let greeting: string
  
  if (currentHour < 12) {
    greeting = "Good morning"
  } else if (currentHour < 17) {
    greeting = "Good afternoon"
  } else {
    greeting = "Good evening"
  }

  // Add user's name if provided
  if (name && name.trim()) {
    return `${greeting}, ${name}`
  }

  return greeting
}

/**
 * Get time-based greeting for a specific role
 * @param role - User role (STUDENT, SUPERVISOR, LECTURER, ADMIN)
 * @param userName - User's full name
 * @param hour - Optional hour for testing (0-23)
 */
export function getGreetingByRole(
  role: string,
  userName?: string | null,
  hour?: number
): string {
  return getTimeBasedGreeting(userName, hour)
}
