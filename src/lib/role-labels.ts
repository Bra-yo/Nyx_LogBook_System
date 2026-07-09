/**
 * Role Label Helper
 *
 * UI terminology uses Learner/Mentor while database roles remain STUDENT/SUPERVISOR
 * for migration safety. This helper provides consistent display labels across the app.
 */

export function getRoleLabel(role: string): string {
  switch (role) {
    case "STUDENT":
      return "Learner";
    case "SUPERVISOR":
      return "Mentor";
    case "LECTURER":
      return "Lecturer";
    case "ADMIN":
      return "Admin";
    case "WORKER":
      return "Worker";
    default:
      return role;
  }
}

export function getRoleLabelPlural(role: string): string {
  switch (role) {
    case "STUDENT":
      return "Learners";
    case "SUPERVISOR":
      return "Mentors";
    case "LECTURER":
      return "Lecturers";
    case "ADMIN":
      return "Admins";
    case "WORKER":
      return "Workers";
    default:
      return `${role}s`;
  }
}

export function getDashboardTitle(role: string): string {
  const label = getRoleLabel(role);
  return `${label} Dashboard`;
}

export function getProfilePageTitle(role: string): string {
  const label = getRoleLabel(role);
  return `${label} Profile`;
}
