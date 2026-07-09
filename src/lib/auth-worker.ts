export interface WorkerAuthPreparation {
  loginIdentifier: "staffNumber";
  defaultPassword: string;
  requirePasswordChangeOnFirstLogin: boolean;
}

export const workerAuthPreparation: WorkerAuthPreparation = {
  loginIdentifier: "staffNumber",
  defaultPassword: "ChangeMe123",
  requirePasswordChangeOnFirstLogin: true,
};
