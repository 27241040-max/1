import { TicketCategory, TicketStatus, type TicketListItem } from "core/email";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { apiClient } from "../lib/api-client";
import { renderWithQuery } from "../test/render-with-query";
import { TicketsPage } from "./TicketsPage";

vi.mock("../lib/api-client", () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

const mockedApiClient = vi.mocked(apiClient);

const ticketsBySortKey: Record<string, TicketListItem[]> = {
  "category:asc": [
    {
      id: 1,
      subject: "Billing issue",
      status: TicketStatus.open,
      category: TicketCategory.general,
      createdAt: "2026-04-14T13:00:00.000Z",
      customer: {
        id: 1,
        name: "Customer One",
        email: "customer.one@example.com",
      },
    },
    {
      id: 2,
      subject: "Tech support",
      status: TicketStatus.resolved,
      category: TicketCategory.technical,
      createdAt: "2026-04-14T14:00:00.000Z",
      customer: {
        id: 2,
        name: "Customer Two",
        email: "customer.two@example.com",
      },
    },
  ],
  "createdAt:asc": [
    {
      id: 1,
      subject: "Older ticket",
      status: TicketStatus.resolved,
      category: TicketCategory.technical,
      createdAt: "2026-04-14T13:00:00.000Z",
      customer: {
        id: 1,
        name: "Customer One",
        email: "customer.one@example.com",
      },
    },
    {
      id: 2,
      subject: "Newest ticket",
      status: TicketStatus.open,
      category: null,
      createdAt: "2026-04-14T14:00:00.000Z",
      customer: {
        id: 2,
        name: "Customer Two",
        email: "customer.two@example.com",
      },
    },
  ],
  "createdAt:desc": [
    {
      id: 2,
      subject: "Newest ticket",
      status: TicketStatus.open,
      category: null,
      createdAt: "2026-04-14T14:00:00.000Z",
      customer: {
        id: 2,
        name: "Customer Two",
        email: "customer.two@example.com",
      },
    },
    {
      id: 1,
      subject: "Older ticket",
      status: TicketStatus.resolved,
      category: TicketCategory.technical,
      createdAt: "2026-04-14T13:00:00.000Z",
      customer: {
        id: 1,
        name: "Customer One",
        email: "customer.one@example.com",
      },
    },
  ],
  "customer:asc": [
    {
      id: 3,
      subject: "A question",
      status: TicketStatus.closed,
      category: null,
      createdAt: "2026-04-14T12:00:00.000Z",
      customer: {
        id: 3,
        name: "Alice",
        email: "alice@example.com",
      },
    },
    {
      id: 4,
      subject: "B question",
      status: TicketStatus.open,
      category: TicketCategory.general,
      createdAt: "2026-04-14T11:00:00.000Z",
      customer: {
        id: 4,
        name: "Bob",
        email: "bob@example.com",
      },
    },
  ],
  "status:asc": [
    {
      id: 5,
      subject: "Closed first",
      status: TicketStatus.closed,
      category: null,
      createdAt: "2026-04-14T10:00:00.000Z",
      customer: {
        id: 5,
        name: "Casey",
        email: "casey@example.com",
      },
    },
    {
      id: 6,
      subject: "Open second",
      status: TicketStatus.open,
      category: TicketCategory.general,
      createdAt: "2026-04-14T09:00:00.000Z",
      customer: {
        id: 6,
        name: "Devon",
        email: "devon@example.com",
      },
    },
  ],
  "subject:asc": [
    {
      id: 7,
      subject: "Alpha ticket",
      status: TicketStatus.open,
      category: null,
      createdAt: "2026-04-14T08:00:00.000Z",
      customer: {
        id: 7,
        name: "Zed",
        email: "zed@example.com",
      },
    },
    {
      id: 8,
      subject: "Beta ticket",
      status: TicketStatus.resolved,
      category: TicketCategory.technical,
      createdAt: "2026-04-14T07:00:00.000Z",
      customer: {
        id: 8,
        name: "Yan",
        email: "yan@example.com",
      },
    },
  ],
};

const ticketsByQueryKey: Record<string, TicketListItem[]> = {
  "category:all|q:|sortBy:createdAt|sortOrder:desc|status:all": ticketsBySortKey["createdAt:desc"],
  "category:all|q:alice|sortBy:createdAt|sortOrder:desc|status:all": [
    {
      id: 10,
      subject: "Ticket for Alice",
      status: TicketStatus.open,
      category: TicketCategory.general,
      createdAt: "2026-04-14T16:00:00.000Z",
      customer: {
        id: 10,
        name: "Alice",
        email: "alice@example.com",
      },
    },
  ],
  "category:all|q:|sortBy:createdAt|sortOrder:desc|status:resolved": [
    {
      id: 11,
      subject: "Resolved ticket",
      status: TicketStatus.resolved,
      category: TicketCategory.technical,
      createdAt: "2026-04-14T15:00:00.000Z",
      customer: {
        id: 11,
        name: "Riley",
        email: "riley@example.com",
      },
    },
  ],
  "category:refund_request|q:|sortBy:createdAt|sortOrder:desc|status:all": [
    {
      id: 12,
      subject: "Refund ticket",
      status: TicketStatus.open,
      category: TicketCategory.refundRequest,
      createdAt: "2026-04-14T14:30:00.000Z",
      customer: {
        id: 12,
        name: "Taylor",
        email: "taylor@example.com",
      },
    },
  ],
};

function getQueryKey(config?: { params?: Record<string, unknown> }) {
  const params = config?.params ?? {};

  return [
    `category:${String(params.category ?? "all")}`,
    `q:${String(params.q ?? "")}`,
    `sortBy:${String(params.sortBy ?? "createdAt")}`,
    `sortOrder:${String(params.sortOrder ?? "desc")}`,
    `status:${String(params.status ?? "all")}`,
  ].join("|");
}

describe("TicketsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders loading state before data resolves", () => {
    mockedApiClient.get.mockReturnValue(new Promise(() => undefined));

    renderWithQuery(<TicketsPage />);

    expect(screen.getByText("工单列表")).toBeVisible();
    expect(screen.getByText("当前共 0 个工单")).toBeVisible();
  });

  test("renders an error state when the request fails", async () => {
    mockedApiClient.get.mockRejectedValue(new Error("boom"));

    renderWithQuery(<TicketsPage />);

    await screen.findByText("工单列表加载失败，请稍后再试。");
    expect(screen.getByText("工单列表加载失败，请稍后再试。")).toBeVisible();
  });

  test("renders an empty state when there are no tickets", async () => {
    mockedApiClient.get.mockResolvedValue({
      data: {
        tickets: [],
      },
    });

    renderWithQuery(<TicketsPage />);

    await screen.findByText("暂无工单数据。");
    expect(screen.getByText("当前共 0 个工单")).toBeVisible();
  });

  test("loads tickets with default createdAt desc sorting", async () => {
    mockedApiClient.get.mockResolvedValue({
      data: {
        tickets: ticketsBySortKey["createdAt:desc"],
      },
    });

    renderWithQuery(<TicketsPage />);

    await screen.findByText("Newest ticket");

    expect(screen.getByText("当前共 2 个工单")).toBeVisible();
    expect(screen.getByText("Customer Two")).toBeVisible();
    expect(screen.getByText("customer.two@example.com")).toBeVisible();
    expect(screen.getAllByText("Open").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Resolved").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Technical").length).toBeGreaterThan(0);
    expect(screen.getByText("未分类")).toBeVisible();

    const rows = screen.getAllByRole("row");
    expect(rows[1]).toHaveTextContent("Newest ticket");
    expect(rows[2]).toHaveTextContent("Older ticket");

    await waitFor(() => {
      expect(mockedApiClient.get).toHaveBeenCalledWith("/api/tickets", {
        params: {
          sortBy: "createdAt",
          sortOrder: "desc",
        },
      });
    });
  });

  test("toggles createdAt sorting between asc and desc", async () => {
    mockedApiClient.get.mockImplementation(async (_url, config) => {
      const sortBy = String(config?.params?.sortBy ?? "createdAt");
      const sortOrder = String(config?.params?.sortOrder ?? "desc");

      return {
        data: {
          tickets: ticketsBySortKey[`${sortBy}:${sortOrder}`] ?? [],
        },
      };
    });

    renderWithQuery(<TicketsPage />);

    await screen.findByText("Newest ticket");

    fireEvent.click(screen.getByRole("button", { name: "创建时间" }));

    await screen.findByText("Older ticket");
    await waitFor(() => {
      expect(mockedApiClient.get).toHaveBeenLastCalledWith("/api/tickets", {
        params: {
          sortBy: "createdAt",
          sortOrder: "asc",
        },
      });
    });

    let rows = screen.getAllByRole("row");
    expect(rows[1]).toHaveTextContent("Older ticket");
    expect(rows[2]).toHaveTextContent("Newest ticket");

    fireEvent.click(screen.getByRole("button", { name: "创建时间" }));

    await waitFor(() => {
      expect(mockedApiClient.get).toHaveBeenLastCalledWith("/api/tickets", {
        params: {
          sortBy: "createdAt",
          sortOrder: "desc",
        },
      });
    });

    rows = screen.getAllByRole("row");
    expect(rows[1]).toHaveTextContent("Newest ticket");
    expect(rows[2]).toHaveTextContent("Older ticket");
  });

  test("requests server-side sorting for every visible sortable column", async () => {
    mockedApiClient.get.mockImplementation(async (_url, config) => {
      const sortBy = String(config?.params?.sortBy ?? "createdAt");
      const sortOrder = String(config?.params?.sortOrder ?? "desc");

      return {
        data: {
          tickets: ticketsBySortKey[`${sortBy}:${sortOrder}`] ?? [],
        },
      };
    });

    renderWithQuery(<TicketsPage />);

    await screen.findByText("Newest ticket");

    fireEvent.click(screen.getByRole("button", { name: "主题" }));
    await screen.findByText("Alpha ticket");
    expect(mockedApiClient.get).toHaveBeenLastCalledWith("/api/tickets", {
      params: {
        sortBy: "subject",
        sortOrder: "asc",
      },
    });

    fireEvent.click(screen.getByRole("button", { name: "客户" }));
    await screen.findByText("Alice");
    expect(mockedApiClient.get).toHaveBeenLastCalledWith("/api/tickets", {
      params: {
        sortBy: "customer",
        sortOrder: "asc",
      },
    });

    fireEvent.click(screen.getByRole("button", { name: "状态" }));
    await screen.findByText("Closed first");
    expect(mockedApiClient.get).toHaveBeenLastCalledWith("/api/tickets", {
      params: {
        sortBy: "status",
        sortOrder: "asc",
      },
    });

    fireEvent.click(screen.getByRole("button", { name: "分类" }));
    await screen.findByText("Billing issue");
    expect(mockedApiClient.get).toHaveBeenLastCalledWith("/api/tickets", {
      params: {
        sortBy: "category",
        sortOrder: "asc",
      },
    });
  });

  test("clears previous column sorting when switching to a new column", async () => {
    mockedApiClient.get.mockImplementation(async (_url, config) => {
      const sortBy = String(config?.params?.sortBy ?? "createdAt");
      const sortOrder = String(config?.params?.sortOrder ?? "desc");

      return {
        data: {
          tickets: ticketsBySortKey[`${sortBy}:${sortOrder}`] ?? [],
        },
      };
    });

    renderWithQuery(<TicketsPage />);

    await screen.findByText("Newest ticket");

    fireEvent.click(screen.getByRole("button", { name: "主题" }));
    await screen.findByText("Alpha ticket");

    fireEvent.click(screen.getByRole("button", { name: "客户" }));
    await screen.findByText("Alice");

    await waitFor(() => {
      expect(mockedApiClient.get).toHaveBeenLastCalledWith("/api/tickets", {
        params: {
          sortBy: "customer",
          sortOrder: "asc",
        },
      });
    });

    const rows = screen.getAllByRole("row");
    expect(rows[1]).toHaveTextContent("Alice");
    expect(rows[2]).toHaveTextContent("Bob");
  });

  test("sends keyword, status, and category filters to the server", async () => {
    mockedApiClient.get.mockImplementation(async (_url, config) => {
      return {
        data: {
          tickets: ticketsByQueryKey[getQueryKey(config)] ?? [],
        },
      };
    });

    renderWithQuery(<TicketsPage />);

    await screen.findByText("Newest ticket");

    fireEvent.change(screen.getByPlaceholderText("搜索主题、客户名或邮箱"), {
      target: { value: "alice" },
    });

    await screen.findByText("Ticket for Alice");
    await waitFor(() => {
      expect(mockedApiClient.get).toHaveBeenLastCalledWith("/api/tickets", {
        params: {
          category: undefined,
          q: "alice",
          sortBy: "createdAt",
          sortOrder: "desc",
          status: undefined,
        },
      });
    });

    fireEvent.click(screen.getByRole("button", { name: "重置筛选" }));
    await screen.findByText("Newest ticket");

    fireEvent.change(screen.getByDisplayValue("全部状态"), {
      target: { value: TicketStatus.resolved },
    });

    await screen.findByText("Resolved ticket");
    await waitFor(() => {
      expect(mockedApiClient.get).toHaveBeenLastCalledWith("/api/tickets", {
        params: {
          category: undefined,
          q: undefined,
          sortBy: "createdAt",
          sortOrder: "desc",
          status: TicketStatus.resolved,
        },
      });
    });

    fireEvent.click(screen.getByRole("button", { name: "重置筛选" }));
    await screen.findByText("Newest ticket");

    fireEvent.change(screen.getByDisplayValue("全部分类"), {
      target: { value: TicketCategory.refundRequest },
    });

    await screen.findByText("Refund ticket");
    await waitFor(() => {
      expect(mockedApiClient.get).toHaveBeenLastCalledWith("/api/tickets", {
        params: {
          category: TicketCategory.refundRequest,
          q: undefined,
          sortBy: "createdAt",
          sortOrder: "desc",
          status: undefined,
        },
      });
    });
  });

  test("clears filters and reloads the default query", async () => {
    mockedApiClient.get.mockImplementation(async (_url, config) => {
      return {
        data: {
          tickets: ticketsByQueryKey[getQueryKey(config)] ?? [],
        },
      };
    });

    renderWithQuery(<TicketsPage />);

    await screen.findByText("Newest ticket");

    fireEvent.change(screen.getByPlaceholderText("搜索主题、客户名或邮箱"), {
      target: { value: "alice" },
    });
    await screen.findByText("Ticket for Alice");

    fireEvent.click(screen.getByRole("button", { name: "重置筛选" }));

    await screen.findByText("Newest ticket");
    await waitFor(() => {
      expect(mockedApiClient.get).toHaveBeenLastCalledWith("/api/tickets", {
        params: {
          category: undefined,
          q: undefined,
          sortBy: "createdAt",
          sortOrder: "desc",
          status: undefined,
        },
      });
    });
  });
});
