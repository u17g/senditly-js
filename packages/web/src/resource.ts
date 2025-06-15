import { Senditly } from "./client";

export class APIError extends Error {
  public readonly code: number;
  constructor(
    code: number,
    message: string,
  ) {
    super(message);
    this.code = code;
  }
}

export class APIPromise<T> extends Promise<T> {
  catch<TResult = never>(
    onrejected?: ((reason: APIError) => TResult | PromiseLike<TResult>) | undefined | null
  ): Promise<T | TResult> {
    return super.catch(onrejected);
  }
}

export class APIResource {
  private readonly client: Senditly;
  constructor(client: Senditly) {
    this.client = client;
  }

  protected _get<T>(path: string, query?: any): APIPromise<T> {
    return this._request<T>("GET", path, query);
  }
  protected _post<T>(path: string, request?: any): APIPromise<T> {
    return this._request<T>("POST", path, request);
  }
  protected _put<T>(path: string, request?: any): APIPromise<T> {
    return this._request<T>("PUT", path, request);
  }
  protected _delete<T>(path: string, request?: any): APIPromise<T> {
    return this._request<T>("DELETE", path, request);
  }

  private _request<T>(method: string, path: string, requestOrQuery?: any): APIPromise<T> {
    return new APIPromise<T>(async (resolve, reject) => {
      try {
        let response: Response;
        const headers = {
          "Content-Type": "application/json",
          "X-Senditly-Workspace-Id": this.client.config.workspaceId,
        }

        if (method === "GET" || method === "TRACE") {
          const url = new URL(`${this.client.config.baseUrl}${path}`);
          url.search = new URLSearchParams(requestOrQuery || {}).toString();
          response = await this.client.config.fetch(url.toString(), {
            method,
            headers,
            mode: "cors",
            credentials: "include",
          });
        } else {
          response = await this.client.config.fetch(`${this.client.config.baseUrl}${path}`, {
            method,
            headers,
            body: JSON.stringify(requestOrQuery || {}),
            mode: "cors",
            credentials: "include",
          });
        }

        // Check if response is ok
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.message || `HTTP ${response.status}: ${response.statusText}`;
          reject(new APIError(response.status, errorMessage));
          return;
        }

        const result = await response.json();
        resolve(result);
      } catch (error) {
        // If error is already APIError, reject with it
        if (error instanceof APIError) {
          reject(error);
          return;
        }

        // Wrap all other errors in APIError
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        reject(new APIError(500, errorMessage));
      }
    });
  }
}