import request from '../context/client';

export interface DeviceDetailPayload {
    userId: number
    deviceId: string
    deviceType: 'WEB'
    brandName: string
    manufacturer: string
    model: string
    osVersion: string
    appVersion: string
    buildNumber: string
    latitude: number
    longitude: number
    isPhysicalDevice: boolean
    fcmToken: string
}

export const deviceApi = {
    saveDeviceRecord: (data: DeviceDetailPayload) =>
        request<any>('/backend/deviceController/saveDevice', {
            method: 'POST',
            body: data,
        }),
}