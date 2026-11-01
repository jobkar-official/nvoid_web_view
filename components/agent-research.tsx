"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { AlertCircle, ArrowUpRight, CheckCircle2, FlaskConical, LoaderCircle, Play, RefreshCw, Search, ShieldCheck } from "lucide-react";

type JsonRecord = Record<string, unknown>;
type ResearchTool = { serverId: string; serverName: string; name: string; description?: string; safety?: string };
type Connector = { serverId: string; serverName: string; enabled: boolean; connected: boolean; connectionError?: string; readOnlyTools?: number; callsSucceeded?: number; callsFailed?: number; recordsReturned?: number };
type ResearchCall = { serverId: string; serverName: string; toolName: string; status: string; recordsReturned: number; durationMs: number; reason: string; error?: string };
type ResearchRecord = { id: string; serverId: string; serverName: string; toolName: string; title?: string; url?: string; data: JsonRecord };
type ResearchResult = {
  query?: string;
  planner?: string;
  report?: {
    connectedServers?: number;
    selectedConnectedServers?: number;
    configuredServers?: number;
    toolsDiscovered?: number;
    readOnlyToolsDiscovered?: number;
    plannedCalls?: number;
    successfulCalls?: number;
    failedCalls?: number;
    uniqueRecords?: number;
    duplicatesRemoved?: number;
    perConnector?: Connector[];
  };
  calls?: ResearchCall[];
  records?: ResearchRecord[];
  warnings?: string[];
};

async function getJson(path: string, init?: RequestInit): Promise<JsonRecord> {
  const response = await fetch(path, { cache: "no-store", ...init });
  const payload: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
      ? payload.error
      : "The research request failed.";
    throw new Error(message);
  }
  return payload && typeof payload === "object" ? payload as JsonRecord : {};
}

function array<T>(value: unknown): T[] { return Array.isArray(value) ? value as T[] : []; }

export default function AgentResearch() {
  const [query, setQuery] = useState("");
  const [tools, setTools] = useState<ResearchTool[]>([]);
  const [connectedCount, setConnectedCount] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [loadingTools, setLoadingTools] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ResearchResult | null>(null);

  const loadTools = useCallback(async () => {
    setLoadingTools(true);
    setError("");
    try {
      const payload = await getJson("/api/research/tools");
      const available = array<ResearchTool>(payload.availableReadOnlyTools);
      const connected = array<{ serverId: string; connected: boolean }>(payload.servers).filter((server) => server.connected);
      setTools(available);
      setConnectedCount(Number(payload.connectedServers ?? connected.length));
      setSelected(connected.map((server) => server.serverId));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load the research tool catalogue.");
      setTools([]);
      setConnectedCount(0);
      setSelected([]);
    } finally {
      setLoadingTools(false);
    }
  }, []);

  useEffect(() => { void loadTools(); }, [loadTools]);

  const runResearch = async (event: FormEvent) => {
    event.preventDefault();
    if (query.trim().length < 3) {
      setError("Enter a research question of at least three characters.");
      return;
    }
    setRunning(true);
    setError("");
    setResult(null);
    try {
      const payload = await getJson("/api/research/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query: query.trim(), serverIds: selected, maxRecords: 100, maxTools: 20 })
      });
      setResult(payload as unknown as ResearchResult);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Research could not be completed.");
    } finally {
      setRunning(false);
    }
  };

  const toggleServer = (serverId: string) => {
    setSelected((current) => current.includes(serverId) ? current.filter((id) => id !== serverId) : [...current, serverId]);
  };

  const uniqueServers = [...new Map(tools.map((tool) => [tool.serverId, tool])).values()];

  return (
    <div className="nvoid-agent-page nvoid-research-page">
      <header className="nvoid-agent-page-heading">
        <div>
          <span className="nvoid-agent-eyebrow"><FlaskConical size={14} /> MULTI-SOURCE RESEARCH</span>
          <h1>Research anything</h1>
          <p>Ask a question and let Nvoid plan read-only calls across connected MCP tools, then consolidate the actual returned records.</p>
        </div>
        <button className="nvoid-agent-refresh" type="button" onClick={() => void loadTools()} disabled={loadingTools}>
          <RefreshCw size={15} className={loadingTools ? "nvoid-spin" : ""} /> Refresh tools
        </button>
      </header>

      <form className="nvoid-research-composer" onSubmit={runResearch}>
        <label htmlFor="nvoid-research-query">Research question</label>
        <textarea id="nvoid-research-query" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="e.g. Find current backend engineering openings at product companies in Germany and include the original career-page links." rows={4} minLength={3} required />
        <div className="nvoid-research-composer-footer">
          <span><ShieldCheck size={14} /> Read-only research. No applications or external changes are submitted.</span>
          <button type="submit" disabled={running || loadingTools || !query.trim()}>{running ? <LoaderCircle size={16} className="nvoid-spin" /> : <Play size={15} />} {running ? "Researching…" : "Run research"}</button>
        </div>
      </form>

      <section className="nvoid-agent-panel">
        <div className="nvoid-agent-panel-heading"><div><h2>Research sources</h2><p>{connectedCount} connected MCP servers · {tools.length} verified read-only tools</p></div><Search size={18} /></div>
        {loadingTools ? <div className="nvoid-agent-empty">Loading available tools…</div> : uniqueServers.length === 0 ? (
          <div className="nvoid-agent-empty"><AlertCircle size={20} /><strong>No read-only research tools available</strong><span>Check Connections and the MCP server configuration on the agent worker.</span></div>
        ) : (
          <div className="nvoid-research-source-list">
            {uniqueServers.map((server) => {
              const sourceTools = tools.filter((tool) => tool.serverId === server.serverId);
              return <label key={server.serverId} className="nvoid-research-source">
                <input type="checkbox" checked={selected.includes(server.serverId)} onChange={() => toggleServer(server.serverId)} />
                <span><strong>{server.serverName}</strong><small>{sourceTools.length} read-only tools · {server.serverId}</small></span>
              </label>;
            })}
          </div>
        )}
      </section>

      {error && <div className="nvoid-agent-alert"><AlertCircle size={16} /><span>{error}</span></div>}

      {result && (
        <div className="nvoid-research-results">
          <section className="nvoid-agent-panel">
            <div className="nvoid-agent-panel-heading"><div><h2>Research report</h2><p>{result.query}</p></div><CheckCircle2 size={18} /></div>
            <div className="nvoid-agent-metrics nvoid-research-metrics">
              <article><span>Unique records</span><strong>{result.report?.uniqueRecords ?? array<ResearchRecord>(result.records).length}</strong><small>After deduplication</small></article>
              <article><span>Successful calls</span><strong>{result.report?.successfulCalls ?? 0}</strong><small>{result.report?.failedCalls ?? 0} failed</small></article>
              <article><span>Planned tools</span><strong>{result.report?.plannedCalls ?? array<ResearchCall>(result.calls).length}</strong><small>{result.planner || "Schema-based"}</small></article>
              <article><span>Connected sources</span><strong>{result.report?.selectedConnectedServers ?? result.report?.connectedServers ?? connectedCount}</strong><small>Selected for this run</small></article>
            </div>
            {array<string>(result.warnings).map((warning, index) => <p className="nvoid-research-warning" key={index}><AlertCircle size={14} /> {warning}</p>)}
          </section>

          <section className="nvoid-agent-panel">
            <div className="nvoid-agent-panel-heading"><div><h2>Tool execution</h2><p>Actual calls made by the worker and their returned counts.</p></div></div>
            <div className="nvoid-research-call-list">
              {array<ResearchCall>(result.calls).map((call, index) => <article key={call.serverId + call.toolName + index}>
                <span className={"nvoid-call-status " + call.status}>{call.status === "success" ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}</span>
                <div><strong>{call.serverName} · {call.toolName}</strong><small>{call.reason}</small>{call.error && <small className="nvoid-connection-error">{call.error}</small>}</div>
                <span className="nvoid-call-count">{call.recordsReturned} records</span>
              </article>)}
              {array<ResearchCall>(result.calls).length === 0 && <div className="nvoid-agent-empty">No tools were called for this query.</div>}
            </div>
          </section>

          <section className="nvoid-agent-panel">
            <div className="nvoid-agent-panel-heading"><div><h2>Returned records</h2><p>{array<ResearchRecord>(result.records).length} unique records from connected sources.</p></div></div>
            <div className="nvoid-research-records">
              {array<ResearchRecord>(result.records).map((record) => <article key={record.id}>
                <div><span>{record.serverName} · {record.toolName}</span><strong>{record.title || "Research record"}</strong></div>
                {record.url?.startsWith("https://") && <a href={record.url} target="_blank" rel="noreferrer">Open source <ArrowUpRight size={13} /></a>}
                <details><summary>Inspect returned data</summary><pre>{JSON.stringify(record.data, null, 2)}</pre></details>
              </article>)}
              {array<ResearchRecord>(result.records).length === 0 && <div className="nvoid-agent-empty">No records were returned. Review tool execution and warnings above to see why.</div>}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
