export type UserRole = 'seeker' | 'recruiter'
export type JobStatus = 'active' | 'paused' | 'closed' | 'draft'
export type AppStatus = 'applied' | 'seen' | 'shortlisted' | 'interview' | 'offered' | 'rejected'

export interface User {
    id: string
    name: string
    email: string
    role: UserRole
    avatar?: string
    phone?: string
    title?: string
    location?: string
    bio?: string
    website?: string
    profileStrength?: number
    skills?: any[]
    education?: any[]
    experience?: any[]
    languages?: any[]
    companyId?: string
    slug?: string
    imageUrl?: string | null
    coverImage?: string | null
    country?: string
    state?: string
    city?: string
    description?: string | null
    openToWork?: boolean
}

export interface Job {
    id: string
    slug: string
    title: string
    company: string
    companyLogo: string
    companySlug: string
    location: string
    state: string
    city: string
    type: string
    category: string
    salaryMin: number
    salaryMax: number
    currency: string
    experience: string
    description: string
    postedAt: string
    isVerified: boolean
    isFeatured: boolean
    applicants: number
    views: number
    status: JobStatus
    requirements: string[]
    benefits: string[]
    skills: string[]
    responseRate?: string
    responseTime?: string
}