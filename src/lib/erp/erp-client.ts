export interface ErpClient {
  // Returns full parsed response: data array and pagination metadata
  fetchEmployees(): Promise<{
    data: unknown[];
    pagination?: Record<string, unknown>;
    pagesFetched: number;
  }>;
  fetchEmployeeByStaffNumber(staffNumber: string): Promise<unknown | null>;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class BgErpClient implements ErpClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly secretKey: string;
  private readonly timeoutMs: number;
  private readonly retries: number;

  constructor() {
    this.baseUrl = (process.env.ERP_BASE_URL || "").replace(/\/$/, "");
    this.apiKey = process.env.ERP_API_KEY || "";
    this.secretKey = process.env.ERP_SECRET_KEY || "";
    this.timeoutMs = Number(process.env.ERP_TIMEOUT || 30000);
    this.retries = 2;
  }

  async fetchEmployees(): Promise<{
    data: unknown[];
    pagination?: Record<string, unknown>;
    pagesFetched: number;
  }> {
    if (!this.baseUrl) {
      throw new Error("ERP_BASE_URL is not configured.");
    }

    // Use documented path exactly
    const endpoint = `${this.baseUrl}/api/v1/bg-clients/employees`;

    // fetch first page
    const first = await this.fetchJson(`${endpoint}?page=1`);
    if (!first || typeof first !== "object") {
      throw new Error("Invalid ERP response format");
    }

    // Validate documented response shape
    const firstObj = first as Record<string, unknown>;
    const success = Boolean(firstObj["success"]);
    if (!success) {
      throw new Error("ERP API returned success=false");
    }

    const data = Array.isArray(firstObj["data"])
      ? (firstObj["data"] as unknown[]).slice()
      : [];
    const pagination =
      (firstObj["pagination"] as Record<string, unknown> | null) ?? null;
    let pagesFetched = 1;

    if (pagination && typeof pagination === "object") {
      const paginationObj = pagination as Record<string, unknown>;
      const lastPage = Number(
        paginationObj["last_page"] ?? paginationObj["lastPage"] ?? 1,
      );
      const totalPages = Number.isFinite(lastPage) ? lastPage : 1;
      for (let p = 2; p <= totalPages; p++) {
        const pageResp = await this.fetchJson(`${endpoint}?page=${p}`);
        if (!pageResp || typeof pageResp !== "object") continue;
        const pageObj = pageResp as Record<string, unknown>;
        const ok = Boolean(pageObj["success"]);
        if (!ok) throw new Error(`ERP API returned success=false on page ${p}`);
        const pageData = Array.isArray(pageObj["data"])
          ? (pageObj["data"] as unknown[])
          : [];
        data.push(...pageData);
        pagesFetched += 1;
      }
    }

    return { data, pagination: pagination ?? undefined, pagesFetched };
  }

  async fetchEmployeeByStaffNumber(
    staffNumber: string,
  ): Promise<unknown | null> {
    if (!staffNumber) {
      return null;
    }

    if (!this.baseUrl) {
      throw new Error("ERP_BASE_URL is not configured.");
    }

    const endpoint = `${this.baseUrl}/api/v1/bg-clients/employees?staffno=${encodeURIComponent(
      staffNumber,
    )}`;

    const resp = await this.fetchJson(endpoint, true);
    if (!resp || typeof resp !== "object") return null;
    const respObj = resp as Record<string, unknown>;
    if (!Boolean(respObj["success"])) return null;
    const arr = respObj["data"];
    if (Array.isArray(arr) && arr.length > 0) return arr[0];
    return null;
  }

  private async fetchJson(
    url: string,
    throwOnNotFound = false,
  ): Promise<unknown> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.retries; attempt += 1) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

        const response = await fetch(url, {
          method: "GET",
          headers: this.buildHeaders(),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (response.status === 404) {
          if (throwOnNotFound) {
            throw new Error(`ERP employee endpoint returned 404 for ${url}`);
          }
          return null;
        }

        if (!response.ok) {
          throw new Error(
            `ERP request failed with status ${response.status}: ${response.statusText}`,
          );
        }

        const contentType = response.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          return null;
        }

        const data = await response.json();
        return data as unknown;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < this.retries) {
          await sleep(250 * (attempt + 1));
          continue;
        }
      }
    }

    throw lastError ?? new Error("ERP request failed.");
  }

  private buildHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      Accept: "application/json",
      "X-API-Key": this.apiKey,
      "X-Secret-Key": this.secretKey,
    };

    // Do not include Authorization header per BG API spec
    return headers;
  }
}
