"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  Activity, AlertCircle, ArrowLeft, CheckCircle2, ChevronDown,
  Database, Download, ExternalLink, FileJson, LoaderCircle, RefreshCw,
  Search, ShieldCheck, XCircle
} from "lucide-react";

type ServerStatus = {
  id: string;
  name: string;
  enabled: boolean;
  transport?: string;
  connected: boolean;
  toolCount?: number;
  error?: string;
};

type ResearchTool = {
  serverId: string;
  serverName: string;
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
  safety: string;
};

type ResearchRecord = {
  id: string;
  serverId: string;
  serverName: string;
  toolName: string;
  title?: string;
  url?: string;
  data: Record<string, unknown>;
};

type ResearchCall = {
  serverId: string;
  serverName: string;
  toolName: string;
  reason: string;
  status: "success" | "failed";
  durationMs: number;
  recordsReturned: number;
  providerReport?: Record<string, unknown>;
  error?: string;
};

type ResearchResponse = {
  query: string;
  generatedAt: string;
  planner: "llm" | "heuristic";
  report: {
    connectedServers: number;
    toolsDiscovered: number;
    readOnlyToolsDiscovered: number;
    plannedCalls: number;
    successfulCalls: number;
    failedCalls: number;
    rawRecords: number;
    uniqueRecords: number;
    duplicatesRemoved: number;
    maxRecords: number;
    truncated: boolean;
    perConnector: Array<{
      serverId: string;
      serverName: string;
      discoveredTools: number;
      readOnlyTools: number;
      callsSucceeded: number;
      callsFailed: number;
      recordsReturned: number;
    }>;
  };
  calls: ResearchCall[];
  records: ResearchRecord[];
  warnings: string[];
};

type ToolInventory = {
  generatedAt: string;
  connectedServers: number;
  configuredServers: number;
  servers: ServerStatus[];
  availableReadOnlyTools: ResearchTool[];
  availableReadOnlyToolCount: number;
};

async function readJson(response: Response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "The research request could not be completed.");
  }
  return data;
}

function downloadFile(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function csvValue(value: unknown): string {
  const text = value === null || value === undefined
    ? ""
    : typeof value === "string"
      ? value
      : JSON.stringify(value);
  return '"' + text.replace(/"/g, '""') + '"';
}

function makeCsv(records: ResearchRecord[]) {
  const fields = [...new Set(records.flatMap((record) => Object.keys(record.data)))].slice(0, 60);
  const headers = ["source", "tool", "title", "url", ...fields];
  const rows = records.map((record) => [
    record.serverName,
    record.toolName,
    record.title ?? "",
    record.url ?? "",
    ...fields.map((field) => record.data[field])
  ]);
  return [headers, ...rows].map((row) => row.map(csvValue).join(",")).join("\n");
}

function formatTimestamp(value?: string) {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function safeValue(value: unknown) {
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2) ?? String(value);
}

export default function ResearchPage() {
  const [inventory, setInventory] = useState<ToolInventory | null>(null);
  const [query, setQuery] = useState("");
  const [maxRecords, setMaxRecords] = useState(250);
  const [maxTools, setMaxTools] = useState(20);
  const [selectedServers, setSelectedServers] = useState<string[]>([]);
  const [result, setResult] = useState<ResearchResponse | null>(null);
  const [loadingInventory, setLoadingInventory] = useState(true);
  const [running, setRunning] = useState(false);
  const [inventoryError, setInventoryError] = useState("");
  const [runError, setRunError] = useState("");

  const loadInventory = useCallback(async () => {
    setLoadingInventory(true);
    try {
      const data = await readJson(await fetch("/api/agent/research", { cache: "no-store" })) as ToolInventory;
      setInventory(data);
      setInventoryError("");
    } catch (error) {
      setInventoryError(error instanceof Error ? error.message : "Could not load live MCP connectors.");
      setInventory(null);
    } finally {
      setLoadingInventory(false);
    }
  }, []);

  useEffect(() => {
    void loadInventory();
  }, [loadInventory]);

  const connectedServers = useMemo(
    () => inventory?.servers.filter((server) => server.connected) ?? [],
    [inventory]
  );

  const runResearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (query.trim().length < 3) {
      setRunError("Enter a research question containing at least three characters.");
      return;
    }
    setRunning(true);
    setRunError("");
    setResult(null);
    try {
      const data = await readJson(await fetch("/api/agent/research", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          serverIds: selectedServers,
          maxRecords,
          maxTools
        })
      })) as ResearchResponse;
      setResult(data);
    } catch (error) {
      setRunError(error instanceof Error ? error.message : "The research run failed.");
    } finally {
      setRunning(false);
    }
  };

  const toggleServer = (serverId: string) => {
    setSelectedServers((current) => {
      if (current.length === 0) return connectedServers.map((server) => server.id).filter((id) => id !== serverId);
      const next = current.includes(serverId)
        ? current.filter((id) => id !== serverId)
        : [...current, serverId];
      return next.length === connectedServers.length ? [] : next;
    });
  };

  const downloadJson = () => {
    if (!result) return;
    downloadFile("nvoid-research-" + Date.now() + ".json", JSON.stringify(result, null, 2), "application/json;charset=utf-8");
  };

  const downloadCsv = () => {
    if (!result) return;
    downloadFile("nvoid-research-" + Date.now() + ".csv", makeCsv(result.records), "text/csv;charset=utf-8");
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-row">
          <div className="brand-mark"><Database size={19} strokeWidth={2.2} /></div>
          <div><div className="brand-name">NVOID</div><div className="brand-caption">Research workspace</div></div>
        </div>
        <div className="nav-label">Workspace</div>
        <nav className="nav-list" aria-label="Research navigation">
          <a className="nav-item" href="/"><ArrowLeft size={16} /><span>Job agent</span></a>
          <a className="nav-item active" href="/research"><Search size={16} /><span>Research agent</span></a>
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-connection">
          <div className="side-connection-title"><Activity size={15} /> Live MCP connections</div>
          <p className="side-connection-copy">Research calls are sent to the worker's actual connected MCP servers. Unconnected sources are not counted as searched.</p>
          <div className="side-connection-footer"><span className="status-dot" />{inventory?.connectedServers ?? 0} connected · {inventory?.availableReadOnlyToolCount ?? 0} read tools</div>
        </div>
        <div className="sidebar-footer">
          <div className="avatar avatar-sm">NV</div>
          <div className="sidebar-user"><strong>Nvoid Research</strong><span>Read-only discovery mode</span></div>
        </div>
      </aside>

      <section className="main-panel">
        <header className="topbar">
          <div className="breadcrumb"><a href="/">Nvoid</a><span>/</span><strong>Research agent</strong></div>
          <div className="topbar-spacer" />
          <span className="topbar-status"><span className="status-dot" /> Live connector inventory</span>
          <button className="icon-button" onClick={loadInventory} disabled={loadingInventory} aria-label="Refresh connectors" title="Refresh connectors">
            <RefreshCw size={15} className={loadingInventory ? "spin" : ""} />
          </button>
        </header>

        <main className="content research-page">
          <div className="page-heading">
            <div>
              <div className="eyebrow"><ShieldCheck size={13} /> Federated MCP discovery</div>
              <h1>Research across connected platforms</h1>
              <p>Ask one question. Nvoid selects relevant read-only MCP tools, executes live calls in parallel, and builds a report from the records actually returned.</p>
            </div>
            <div className="research-live-label"><span className="status-dot" /> Real connector execution</div>
          </div>

          <section className="panel research-query-panel">
            <div className="panel-header">
              <div><h2 className="panel-title">Research request</h2><p className="panel-subtitle">Natural language query · bulk extraction · source-level diagnostics</p></div>
              <span className="tag"><ShieldCheck size={11} /> Read-only mode</span>
            </div>
            <div className="panel-body">
              <form onSubmit={runResearch}>
                <div className="field-wrap">
                  <label htmlFor="research-query">What should Nvoid find?</label>
                  <textarea
                    id="research-query"
                    className="field research-query-input"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Example: Find SaaS companies in India hiring backend engineers, retrieve open roles, company details and original source URLs."
                    maxLength={2000}
                    required
                  />
                  <span className="field-help">Use a specific question. The planner uses your wording and the connected tools' published schemas; it will not invent account IDs or credentials.</span>
                </div>

                <div className="research-controls">
                  <div className="field-wrap">
                    <label htmlFor="research-record-limit">Maximum unique records</label>
                    <select id="research-record-limit" className="field" value={maxRecords} onChange={(event) => setMaxRecords(Number(event.target.value))}>
                      <option value={100}>100 records</option>
                      <option value={250}>250 records</option>
                      <option value={500}>500 records</option>
                      <option value={1000}>1,000 records</option>
                    </select>
                  </div>
                  <div className="field-wrap">
                    <label htmlFor="research-tool-limit">Maximum MCP tool calls</label>
                    <select id="research-tool-limit" className="field" value={maxTools} onChange={(event) => setMaxTools(Number(event.target.value))}>
                      <option value={5}>5 calls</option>
                      <option value={10}>10 calls</option>
                      <option value={20}>20 calls</option>
                      <option value={40}>40 calls</option>
                    </select>
                  </div>
                  <div className="research-submit-wrap">
                    <button type="submit" className="primary-button" disabled={running || loadingInventory || !inventory?.availableReadOnlyToolCount}>
                      {running ? <LoaderCircle size={15} className="spin" /> : <Search size={15} />}
                      {running ? "Research running…" : "Start live research"}
                    </button>
                  </div>
                </div>
              </form>
              <div className="research-source-heading">
                <div><strong>Connected research sources</strong><span>Select specific connectors or leave all unchecked to search every connected source with safe read tools.</span></div>
                <span className="tag">{selectedServers.length === 0 ? "All sources" : selectedServers.length + " selected"}</span>
              </div>

              {inventoryError && <div className="notice error research-notice"><AlertCircle size={14} />{inventoryError}</div>}
              {loadingInventory && <div className="research-loading"><LoaderCircle size={16} className="spin" /> Reading connected MCP tool catalog…</div>}
              {!loadingInventory && connectedServers.length === 0 && !inventoryError && (
                <div className="research-empty-connectors"><AlertCircle size={17} /><div><strong>No MCP server is connected.</strong><span>Configure a real HTTP, SSE, or stdio MCP endpoint and its credentials in the worker. Nvoid will only report sources that are genuinely connected.</span></div></div>
              )}
              <div className="research-connector-grid">
                {connectedServers.map((server) => {
                  const count = inventory?.availableReadOnlyTools.filter((tool) => tool.serverId === server.id).length ?? 0;
                  const checked = selectedServers.length === 0 || selectedServers.includes(server.id);
                  return (
                    <label key={server.id} className={"research-connector-card" + (checked ? " selected" : "")}>
                      <input type="checkbox" checked={checked} onChange={() => toggleServer(server.id)} />
                      <span className="research-connector-indicator"><CheckCircle2 size={15} /></span>
                      <span className="research-connector-copy"><strong>{server.name}</strong><small>{server.id} · {count} read-only tool(s)</small></span>
                      <span className="research-connector-count">{count}</span>
                    </label>
                  );
                })}
              </div>
              <div className="research-safety-note"><ShieldCheck size={14} /><span>Only read-only research tools are eligible. Mutating, destructive, publishing, submission and account-changing tools are blocked from this workflow.</span></div>
              {runError && <div className="notice error research-notice"><AlertCircle size={14} />{runError}</div>}
            </div>
          </section>

          {result && (
            <div className="research-results">
              <div className="research-result-header">
                <div><div className="eyebrow"><CheckCircle2 size={13} /> Research completed</div><h2 className="research-result-title">Live research report</h2><p className="panel-subtitle">Generated {formatTimestamp(result.generatedAt)} · {result.planner === "llm" ? "AI-assisted tool planning" : "Schema-based fallback planning"}</p></div>
                <div className="research-export-actions">
                  <button type="button" className="secondary-button" onClick={downloadCsv} disabled={result.records.length === 0}><Download size={14} /> Export CSV</button>
                  <button type="button" className="secondary-button" onClick={downloadJson}><FileJson size={14} /> Export JSON</button>
                </div>
              </div>

              <div className="research-metric-grid">
                <Metric label="Unique records" value={result.report.uniqueRecords} foot="After deduplication" />
                <Metric label="Raw records" value={result.report.rawRecords} foot={result.report.duplicatesRemoved + " duplicates removed"} />
                <Metric label="Successful calls" value={result.report.successfulCalls} foot={result.report.failedCalls + " failed calls"} />
                <Metric label="Read tools" value={result.report.readOnlyToolsDiscovered} foot={result.report.connectedServers + " connected servers"} />
              </div>

              {result.warnings.length > 0 && (
                <section className="panel research-warning-panel">
                  <div className="panel-body">
                    {result.warnings.map((warning, index) => <div className="research-warning" key={index}><AlertCircle size={14} />{warning}</div>)}
                  </div>
                </section>
              )}

              <section className="panel">
                <div className="panel-header"><div><h2 className="panel-title">Connector coverage</h2><p className="panel-subtitle">What each connected platform actually did during this run</p></div><Database size={17} color="#6d87b2" /></div>
                <div className="research-coverage-list">
                  {result.report.perConnector.map((source) => (
                    <div className="research-coverage-row" key={source.serverId}>
                      <div className="research-coverage-name"><strong>{source.serverName}</strong><small>{source.serverId} · {source.readOnlyTools}/{source.discoveredTools} read-only tools</small></div>
                      <div className="research-coverage-stat"><strong>{source.callsSucceeded}</strong><small>success</small></div>
                      <div className="research-coverage-stat"><strong>{source.callsFailed}</strong><small>failed</small></div>
                      <div className="research-coverage-stat"><strong>{source.recordsReturned}</strong><small>records</small></div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="panel">
                <div className="panel-header"><div><h2 className="panel-title">Executed MCP calls</h2><p className="panel-subtitle">Tool, connector, execution time, returned records and errors</p></div><Activity size={17} color="#6d87b2" /></div>
                <div className="research-call-list">
                  {result.calls.map((call, index) => (
                    <div className="research-call-row" key={call.serverId + "/" + call.toolName + "/" + index}>
                      <span className={"research-call-icon " + (call.status === "success" ? "success" : "failed")}>{call.status === "success" ? <CheckCircle2 size={15} /> : <XCircle size={15} />}</span>
                      <div className="research-call-main"><strong>{call.toolName}</strong><small>{call.serverName} · {call.reason}</small>{call.error && <span className="research-call-error">{call.error}</span>}{call.providerReport && <details className="research-provider-report"><summary>Provider crawl metrics</summary><pre>{JSON.stringify(call.providerReport, null, 2)}</pre></details>}</div>
                      <div className="research-call-meta"><strong>{call.recordsReturned}</strong><small>records</small></div>
                      <div className="research-call-meta"><strong>{call.durationMs.toLocaleString()} ms</strong><small>{call.status}</small></div>
                    </div>
                  ))}
                  {result.calls.length === 0 && <div className="research-empty-results">No connector tool call was executed for this query.</div>}
                </div>
              </section>

              <section className="panel">
                <div className="panel-header">
                  <div><h2 className="panel-title">Retrieved records</h2><p className="panel-subtitle">Actual MCP response data · source attribution retained · {result.records.length.toLocaleString()} shown</p></div>
                  <span className="tag">{result.report.truncated ? "Result cap reached" : "All returned records shown"}</span>
                </div>
                <div className="research-record-list">
                  {result.records.map((record) => (
                    <details className="research-record" key={record.id}>
                      <summary>
                        <span className="research-record-marker"><Database size={14} /></span>
                        <span className="research-record-summary"><strong>{record.title || record.id}</strong><small>{record.serverName} · {record.toolName}</small></span>
                        <span className="research-record-open">{record.url ? <a href={record.url} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>Open source <ExternalLink size={11} /></a> : <ChevronDown size={15} />}</span>
                      </summary>
                      <div className="research-record-body">
                        {record.url && <a className="text-link" href={record.url} target="_blank" rel="noreferrer">{record.url} <ExternalLink size={11} /></a>}
                        <pre>{safeValue(record.data)}</pre>
                      </div>
                    </details>
                  ))}
                  {result.records.length === 0 && <div className="research-empty-results">No records were returned by the tools executed for this query. Inspect call errors and connector coverage above.</div>}
                </div>
              </section>
            </div>
          )}

          <div className="footer-note"><ShieldCheck size={13} /> Nvoid live research · Actual connected MCP calls · Read-only execution · No synthetic records</div>
        </main>
      </section>
    </div>
  );
}

function Metric({ label, value, foot }: { label: string; value: number; foot: string }) {
  return <article className="metric-card"><div className="metric-top"><span className="metric-label">{label}</span><span className="metric-icon"><Database size={15} /></span></div><div className="metric-value">{value.toLocaleString()}</div><div className="metric-foot"><span className="metric-muted">{foot}</span></div></article>;
}
