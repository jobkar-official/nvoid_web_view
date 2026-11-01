import request from '../context/client';


export interface SaveDevicePayload {
    userId: number;
    deviceId: string;
    deviceType: 'ANDROID' | 'IOS' | 'WEB' | string;
    brandName: string;
    manufacturer: string;
    model: string;
    osVersion: string;
    appVersion: string;
    buildNumber: string | number;
    latitude: number | null;
    longitude: number | null;
    isPhysicalDevice: boolean;
    fcmToken: string;
}


export const generalApi = {
    saveDevice: (data: SaveDevicePayload) =>
        request<any>('/backend/deviceController/saveDevice', {
            method: 'POST',
            body: data,
        }),
};