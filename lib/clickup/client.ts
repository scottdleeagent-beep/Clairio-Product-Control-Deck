import { getEnv } from "@/lib/env";
import type { ClickUpTask, ClickUpTasksResponse } from "@/lib/clickup/types";

const CLICKUP_API_BASE = "https://api.clickup.com/api/v2";

type ClickUpClientOptions = {
  apiToken?: string;
};

export class ClickUpClient {
  private readonly apiToken: string;

  constructor(options: ClickUpClientOptions = {}) {
    this.apiToken = options.apiToken ?? getEnv().CLICKUP_API_TOKEN;
  }

  async getFilteredTeamTasks(updatedAfter?: Date): Promise<ClickUpTask[]> {
    const teamId = getEnv().CLICKUP_TEAM_ID ?? getEnv().CLICKUP_WORKSPACE_ID;
    const collected: ClickUpTask[] = [];
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
        `/team/${teamId}/task?${searchParams.toString()}`
      );

      collected.push(...response.tasks);
      hasMore = response.last_page === false;
      page += 1;
    }

    return collected;
  }

  async getTask(taskId: string): Promise<ClickUpTask> {
    return this.request<ClickUpTask>(`/task/${taskId}`);
  }

  private async request<T>(path: string): Promise<T> {
    const response = await fetch(`${CLICKUP_API_BASE}${path}`, {
      headers: {
        Authorization: this.apiToken,
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

