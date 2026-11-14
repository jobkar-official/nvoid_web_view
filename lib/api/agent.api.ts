import request from '../context/client';

export interface JobLocation {
    raw: string;
    city: string;
    countryCode: string;
}

export interface JobSource {
    id: string;
    name: string;
    type: 'board' | 'company' | 'aggregator' | string;
}

export type MatchType = 'exact' | 'partial' | 'none' | string;

export interface JobMatch {
    title: MatchType;
    location: MatchType;
}

export interface JobPosting {
    id: string;
    title: string;
    company: string;
    location: JobLocation;
    remote: boolean;
    skills: string[];
    summary: string | null;
    postedAt: string | null;
    employmentType: string | null;
    salary: string | number | null;
    source: JobSource;
    url: string;
    applyUrl: string;
    firstSeen: string;
    match: JobMatch;
}

export interface JobSearchQuery {
    title: string;
    location: string;
    country: string;
    skills: string[];
    company: string | null;
    remote: string;
}

export interface JobSearchResponse {
    query: JobSearchQuery;
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    meta: {
        tiers: {
            exact: number;
            nearby: number;
        };
        relaxed: boolean;
        indexed: number;
        notes: string[];
        generatedAt: string;
    };
    jobs: JobPosting[];
}

export const agentApi = {
    fetchResults: (jobtitle: string, location: string) =>
        request<JobSearchResponse>(`${process.env.NVOID_AGENT_API_URL}agent/crawl?jobtitle=${encodeURIComponent(jobtitle)}&location=${encodeURIComponent(location)}`, {
            method: 'GET',
            headers: {
                "x-api-key": process.env.NVOID_AGENT_API_KEY || "",
            },
        }),

    allJobCrawl: () =>
        request<JobSearchResponse>(`${process.env.NVOID_AGENT_API_URL}agent/crawl`, {
            method: 'GET',
            headers: {
                "x-api-key": process.env.NVOID_AGENT_API_KEY || "",
            },
        }),
};