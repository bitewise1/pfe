import DeviceInfo from "react-native-device-info";

export async function getLocalAPI() {
    const ip = await DeviceInfo.getIpAddress();
    return `http://${ip}:3000`;
}
