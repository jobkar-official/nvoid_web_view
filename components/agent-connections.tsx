"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, AlertCircle, CheckCircle2, CircleHelp, PlugZap, RefreshCw, Search, Server, Wrench } from "lucide-react";

type ServerStatus = {
  id: string;
  name: string;
  enabled: boolean;
  connected: boolean;
  transport?: string;
  toolCount?: number;
  tools?: Array<{ name: string; description?: string }>;
  error?: string;
  jobSearchAvailable?: boolean;
  searchTool?: string;
  searchTools?: string[];
};

type ToolServer = {
  serverId: string;
  serverName: string;
  tools: Array<{ name: string; description?: string }>;
};

async function getJson(path: string) {
  const response = await fetch(path, { cache: "no-store" });
  const payload: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
      ? payload.error
      : "The agent connection request failed.";
    const detail = payload && typeof payload === "object" && "detail" in payload && typeof payload.detail === "string"
      ? payload.detail
      : "";
    throw new Error([message, detail].filter(Boolean).join(" "));
  }
  return payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
}

function asArray<T>(value: unknown): T[] { return Array.isArray(value) ? value as T[] : []; }

export default function AgentConnections() {
  const [health, setHealth] = useState<Record<string, unknown> | null>(null);
  const [servers, setServers] = useState<ServerStatus[]>([]);
  const [toolServers, setToolServers] = useState<ToolServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    const [healthResult, sourceResult, jobResult, toolsResult] = await Promise.allSettled([
      getJson("/api/agent/health"),
      getJson("/api/agent/sources"),
      getJson("/api/agent/job-sources"),
      getJson("/api/agent/tools")
    ]);

    const errors: string[] = [];
    if (healthResult.status === "fulfilled") {
      setHealth(healthResult.value);
      if (healthResult.value.status !== "ok") errors.push(typeof healthResult.value.error === "string" ? healthResult.value.error : "The worker health endpoint did not report an online status.");
    } else {
      setHealth(null);
      errors.push(healthResult.reason instanceof Error ? healthResult.reason.message : "The worker health check failed.");
    }

    const baseServers = sourceResult.status === "fulfilled" ? asArray<ServerStatus>(sourceResult.value.servers) : [];
    const searchableServers = jobResult.status === "fulfilled" ? asArray<ServerStatus>(jobResult.value.sources) : [];
    const merged = new Map<string, ServerStatus>();
    for (const server of baseServers) merged.set(server.id, server);
    for (const server of searchableServers) merged.set(server.id, { ...merged.get(server.id), ...server });
    setServers([...merged.values()]);

    if (sourceResult.status === "rejected") errors.push(sourceResult.reason instanceof Error ? sourceResult.reason.message : "MCP connection statuses could not be loaded.");
    if (jobResult.status === "rejected") errors.push(jobResult.reason instanceof Error ? jobResult.reason.message : "Job-search source statuses could not be loaded.");

    if (toolsResult.status === "fulfilled") setToolServers(asArray<ToolServer>(toolsResult.value.servers));
    else {
      setToolServers([]);
      errors.push(toolsResult.reason instanceof Error ? toolsResult.reason.message : "MCP tools could not be loaded.");
    }

    setError([...new Set(errors)].join(" "));
    setLastUpdated(new Date().toISOString());
    setLoading(false);
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const connected = servers.filter((server) => server.connected).length;
  const searchable = servers.filter((server) => server.connected && server.jobSearchAvailable).length;
  const toolCount = toolServers.reduce((total, server) => total + server.tools.length, 0);
  const agentOnline = health?.status === "ok";

  return (
    <div className="nvoid-agent-page">
      <header className="nvoid-agent-page-heading">
        <div>
          <span className="nvoid-agent-eyebrow"><PlugZap size={14} /> AGENT INFRASTRUCTURE</span>
          <h1>Connections</h1>
          <p>Inspect the live Nvoid worker, connected MCP servers, searchable sources and available tools.</p>
        </div>
        <button className="nvoid-agent-refresh" type="button" onClick={() => void refresh()} disabled={loading}>
          <RefreshCw size={15} className={loading ? "nvoid-spin" : ""} /> Refresh
        </button>
      </header>

      {error && <div className="nvoid-agent-alert"><AlertCircle size={16} /><span>{error}</span></div>}

      <section className="nvoid-agent-metrics">
        <article><span>Agent worker</span><strong className={agentOnline ? "is-online" : "is-offline"}>{loading ? "Checking" : agentOnline ? "Online" : "Unavailable"}</strong><small>Health endpoint</small></article>
        <article><span>Connected MCP servers</span><strong>{loading ? "—" : connected + " / " + servers.length}</strong><small>Live connector sessions</small></article>
        <article><span>Job-search sources</span><strong>{loading ? "—" : searchable}</strong><small>Connected with a recognized search tool</small></article>
        <article><span>Available tools</span><strong>{loading ? "—" : toolCount}</strong><small>Tools exposed by connected servers</small></article>
      </section>

      <section className="nvoid-agent-panel">
        <div className="nvoid-agent-panel-heading">
          <div><h2>Source connections</h2><p>Each row reflects the worker's current connector status, not a static configuration list.</p></div>
          <Server size={18} />
        </div>
        {loading && servers.length === 0 ? <div className="nvoid-agent-empty">Loading connector status…</div> : servers.length === 0 ? (
          <div className="nvoid-agent-empty"><CircleHelp size={20} /><strong>No connector status returned</strong><span>Check that the Nvoid worker is running and its MCP configuration is loaded.</span></div>
        ) : (
          <div className="nvoid-connection-list">
            {servers.map((server) => {
              const catalog = toolServers.find((entry) => entry.serverId === server.id);
              const tools = catalog?.tools ?? server.tools ?? [];
              return (
                <article className="nvoid-connection-card" key={server.id}>
                  <div className="nvoid-connection-card-top">
                    <span className={"nvoid-connection-indicator" + (server.connected ? " connected" : "")}><span /></span>
                    <div className="nvoid-connection-name"><strong>{server.name || server.id}</strong><small>{server.id} · {server.transport || "MCP"}</small></div>
                    <span className={"nvoid-connection-status" + (server.connected ? " connected" : " disconnected")}>{server.connected ? "Connected" : server.enabled ? "Disconnected" : "Disabled"}</span>
                  </div>
                  <div className="nvoid-connection-facts">
                    <span><Wrench size={13} /> {tools.length || server.toolCount || 0} tools</span>
                    <span><Search size={13} /> {server.jobSearchAvailable ? "Job search enabled" : "No job-search tool"}</span>
                    {server.searchTool && <span>Search tool: {server.searchTool}</span>}
                  </div>
                  {server.error && <p className="nvoid-connection-error">{server.error}</p>}
                  {tools.length > 0 && (
                    <details className="nvoid-tool-details">
                      <summary>View available tools</summary>
                      <div>{tools.map((tool) => <article key={tool.name}><strong>{tool.name}</strong>{tool.description && <p>{tool.description}</p>}</article>)}</div>
                    </details>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <div className="nvoid-agent-footnote">
        <Activity size={15} />
        <span>Connector endpoints and credentials are managed in the agent worker configuration. This page reports live status; it does not expose or edit secrets.</span>
      </div>
      <p className="nvoid-agent-updated">{lastUpdated ? "Last checked " + new Date(lastUpdated).toLocaleTimeString() : ""}</p>
    </div>
  );
}
