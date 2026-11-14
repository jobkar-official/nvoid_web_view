import request from '../context/client';


export interface GoogleOAuthPayload {
    platform: string;
    name: string;
    email: string;
    phone?: string;
    imageUrl?: string;
    gender?: string;
    country?: string;
    state?: string;
    city?: string;
    dob?: string;
    cloudToken: string;
    roleId: number;
}


export const googleOAuth = (data: GoogleOAuthPayload) =>
    request("/auth/oauth", {
        method: "POST",
        body: data,
    });