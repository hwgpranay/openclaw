import { Value } from "typebox/value";
import { describe, expect, it } from "vitest";
import {
  SessionsCatalogHostEventSchema,
  SessionsCatalogListParamsSchema,
  SessionsCatalogListResultSchema,
} from "./sessions-catalog.js";

describe("SessionsCatalogListResultSchema", () => {
  it("accepts a closed catalog result with hosts", () => {
    expect(
      Value.Check(SessionsCatalogListResultSchema, {
        catalogs: [
          {
            id: "claude",
            label: "Claude Code",
            capabilities: {
              continueSession: true,
              archive: false,
              createSession: { model: "anthropic/claude-opus-4-8" },
              openTerminal: true,
            },
            hosts: [
              {
                hostId: "gateway:local",
                label: "Gateway",
                kind: "gateway",
                connected: true,
                sessions: [
                  {
                    threadId: "thread-1",
                    status: "idle",
                    archived: false,
                    createdBy: { id: "profile-ada", label: "Ada" },
                    visibility: "read-only",
                    sharingRole: "member",
                    canContinue: true,
                    canArchive: false,
                    canOpenTerminal: true,
                  },
                ],
              },
            ],
          },
        ],
      }),
    ).toBe(true);
  });

  it("round-trips optional sharing fields on session rows", () => {
    const result = {
      catalogs: [
        {
          id: "openclaw",
          label: "OpenClaw",
          capabilities: { continueSession: true, archive: true },
          hosts: [
            {
              hostId: "gateway:local",
              label: "Gateway",
              kind: "gateway",
              connected: true,
              sessions: [
                {
                  threadId: "thread-shared",
                  status: "idle",
                  archived: false,
                  visibility: "suggest",
                  sharingRole: "owner",
                  canContinue: true,
                  canArchive: true,
                },
              ],
            },
          ],
        },
      ],
    };
    const roundTripped = JSON.parse(JSON.stringify(result)) as typeof result;

    expect(Value.Check(SessionsCatalogListResultSchema, roundTripped)).toBe(true);
    expect(roundTripped.catalogs[0]?.hosts[0]?.sessions[0]).toMatchObject({
      visibility: "suggest",
      sharingRole: "owner",
    });
  });
});

describe("SessionsCatalogListParamsSchema", () => {
  it("accepts an optional progressive stream id without a catalog selector", () => {
    expect(
      Value.Check(SessionsCatalogListParamsSchema, {
        agentId: "main",
        progressId: "progress-1",
      }),
    ).toBe(true);
  });

  it("accepts an optional agent scope", () => {
    expect(
      Value.Check(SessionsCatalogListParamsSchema, {
        agentId: "research",
        catalogId: "claude",
      }),
    ).toBe(true);
  });

  it("accepts flat optional catalog cursor fields", () => {
    expect(
      Value.Check(SessionsCatalogListParamsSchema, { cursors: { "gateway:local": "1" } }),
    ).toBe(true);
    expect(
      Value.Check(SessionsCatalogListParamsSchema, {
        catalogId: "claude",
        cursors: { "gateway:local": "1" },
      }),
    ).toBe(true);
  });
});

describe("SessionsCatalogHostEventSchema", () => {
  it("accepts one completed host and rejects unknown fields", () => {
    const event = {
      progressId: "progress-1",
      agentId: "main",
      catalog: {
        id: "codex",
        label: "Codex",
        capabilities: { continueSession: true, archive: true },
        hosts: [
          {
            hostId: "gateway:local",
            label: "Local Codex",
            kind: "gateway",
            connected: true,
            sessions: [],
          },
        ],
      },
    };

    expect(Value.Check(SessionsCatalogHostEventSchema, event)).toBe(true);
    expect(Value.Check(SessionsCatalogHostEventSchema, { ...event, unexpected: true })).toBe(false);
    expect(
      Value.Check(SessionsCatalogHostEventSchema, {
        ...event,
        catalog: { ...event.catalog, hosts: [] },
      }),
    ).toBe(false);
    expect(
      Value.Check(SessionsCatalogHostEventSchema, {
        ...event,
        catalog: { ...event.catalog, hosts: [event.catalog.hosts[0], event.catalog.hosts[0]] },
      }),
    ).toBe(false);
  });
});
