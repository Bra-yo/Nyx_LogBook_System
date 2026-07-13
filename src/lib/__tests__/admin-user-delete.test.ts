import test from "node:test";
import assert from "node:assert/strict";
import { deleteUserPermanently } from "../admin-user-delete";

const { describe, it } = test;

describe("deleteUserPermanently", () => {
  it("cleans up supervisor references before deleting the profile", async () => {
    const calls: string[] = [];

    const tx = {
      auditLog: {
        deleteMany: async () => {
          calls.push("auditLog.deleteMany");
          return { count: 0 };
        },
      },
      notification: {
        deleteMany: async () => {
          calls.push("notification.deleteMany");
          return { count: 0 };
        },
      },
      session: {
        deleteMany: async () => {
          calls.push("session.deleteMany");
          return { count: 0 };
        },
      },
      user: {
        findUnique: async () => ({
          id: "user-1",
          role: "SUPERVISOR",
          supervisorProfile: { id: "profile-1" },
        }),
        delete: async () => {
          calls.push("user.delete");
          return { id: "user-1" };
        },
      },
      supervisorProfile: {
        delete: async () => {
          calls.push("supervisorProfile.delete");
          return { id: "profile-1" };
        },
      },
      studentProfile: {
        updateMany: async () => {
          calls.push("studentProfile.updateMany");
          return { count: 0 };
        },
      },
      project: {
        updateMany: async () => {
          calls.push("project.updateMany");
          return { count: 0 };
        },
      },
      milestone: {
        updateMany: async () => {
          calls.push("milestone.updateMany");
          return { count: 0 };
        },
      },
      officeLocation: {
        updateMany: async () => {
          calls.push("officeLocation.updateMany");
          return { count: 0 };
        },
      },
      supervisorComment: {
        deleteMany: async () => {
          calls.push("supervisorComment.deleteMany");
          return { count: 0 };
        },
      },
      milestoneMentorAssessment: {
        deleteMany: async () => {
          calls.push("milestoneMentorAssessment.deleteMany");
          return { count: 0 };
        },
      },
      weeklyMentorTaskReview: {
        deleteMany: async () => {
          calls.push("weeklyMentorTaskReview.deleteMany");
          return { count: 0 };
        },
      },
      taskWorkLog: {
        updateMany: async () => {
          calls.push("taskWorkLog.updateMany");
          return { count: 0 };
        },
      },
    } as any;

    await deleteUserPermanently(tx, "user-1", "SUPERVISOR");

    assert.ok(calls.includes("supervisorComment.deleteMany"));
    assert.ok(calls.includes("officeLocation.updateMany"));
    assert.ok(calls.includes("supervisorProfile.delete"));
    assert.ok(calls.includes("user.delete"));
  });
});
