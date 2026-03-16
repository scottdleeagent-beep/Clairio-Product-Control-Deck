import { getClickUpScopeConfig } from "@/lib/env";
import { getClickUpOAuthConnection } from "@/lib/local-db";
import type {
  ClickUpFolderListsResponse,
  ClickUpTask,
  ClickUpTasksResponse
} from "@/lib/clickup/types";

const CLICKUP_API_BASE = "https://api.clickup.com/api/v2";

type ClickUpClientOptions = {
  apiToken?: string;
  accessToken?: string;
};

export class ClickUpClient {
  private readonly authHeader: string;

  constructor(options: ClickUpClientOptions = {}) {
    const oauthAccessToken = options.accessToken ?? getClickUpOAuthConnection()?.accessToken ?? null;
    const personalToken = options.apiToken ?? process.env.CLICKUP_API_TOKEN ?? null;

    if (oauthAccessToken) {
      this.authHeader = `Bearer ${oauthAccessToken}`;
      return;
    }

    if (personalToken) {
      this.authHeader = personalToken;
      return;
    }

    throw new Error(
      "No ClickUp access token is configured. Connect ClickUp with OAuth or add CLICKUP_API_TOKEN."
    );
  }

  async getScopedFolderTasks(updatedAfter?: Date): Promise<ClickUpTask[]> {
    const scope = getClickUpScopeConfig();

    if (!scope.folderId) {
      throw new Error("Missing ClickUp folder ID for Clairio Suite scope.");
    }

    const collected: ClickUpTask[] = [];
    const lists = await this.request<ClickUpFolderListsResponse>(`/folder/${scope.folderId}/list`);

    for (const list of lists.lists) {
      let page = 0;
      let hasMore = true;

      while (hasMore) {
        const searchParams = new URLSearchParams({
          subtasks: "true",
          include_closed: "true",
          page: page.toString()
        });

        if (updatedAfter) {
          searchParams.set("date_updated_gt", updatedAfter.getTime().toString());
        }

        const response = await this.request<ClickUpTasksResponse>(
          `/list/${list.id}/task?${searchParams.toString()}`
        );

        collected.push(...response.tasks);
        hasMore = response.last_page === false;
        page += 1;
      }
    }

    return collected;
  }

  async getTask(taskId: string): Promise<ClickUpTask> {
    return this.request<ClickUpTask>(`/task/${taskId}`);
  }

  private async request<T>(path: string): Promise<T> {
    const response = await fetch(`${CLICKUP_API_BASE}${path}`, {
      headers: {
        Authorization: this.authHeader,
        "Content-Type": "application/json"
      },
      cache: "no-store"
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`ClickUp request failed (${response.status}): ${body}`);
    }

    return response.json() as Promise<T>;
  }
}
