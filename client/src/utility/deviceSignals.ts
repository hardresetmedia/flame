import { DeviceClass } from '../interfaces';

export interface DeviceSignals {
  deviceClass: DeviceClass | 'unknown';
  touch: boolean;
  viewport: { width: number; height: number };
  // null where the browser can't tell (Safari/Firefox have no Battery API)
  batteryPresent: boolean | null;
}

// Best-effort device classification. Viewport, touch and time are reliable;
// device class and battery are heuristic — rules should lean on the reliable
// primitives (the settings UI says so). getBattery() is Promise-based, hence
// the async surface.
export const getDeviceSignals = async (): Promise<DeviceSignals> => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  const coarse =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(pointer: coarse)').matches;
  const touch = coarse || navigator.maxTouchPoints > 0;

  // battery presence (laptop vs desktop heuristic)
  let batteryPresent: boolean | null = null;
  const nav = navigator as Navigator & {
    getBattery?: () => Promise<{
      charging: boolean;
      level: number;
      chargingTime: number;
      dischargingTime: number;
    }>;
    userAgentData?: { mobile?: boolean };
  };

  if (typeof nav.getBattery === 'function') {
    try {
      const battery = await nav.getBattery();
      // A device with no battery reports charging=true, level=1 and an
      // infinite dischargingTime. Anything else implies a battery is present.
      batteryPresent =
        battery.dischargingTime !== Infinity ||
        battery.level < 1 ||
        !battery.charging;
    } catch {
      batteryPresent = null;
    }
  }

  // device class
  let deviceClass: DeviceClass | 'unknown';
  const shortEdge = Math.min(window.screen.width, window.screen.height);

  if (touch) {
    deviceClass = shortEdge < 600 ? 'phone' : 'tablet';
  } else if (batteryPresent === true) {
    deviceClass = 'laptop';
  } else if (batteryPresent === false) {
    deviceClass = 'desktop';
  } else if (nav.userAgentData?.mobile) {
    deviceClass = 'phone';
  } else {
    // no touch, battery unknown: assume a desktop-class machine
    deviceClass = 'desktop';
  }

  return {
    deviceClass,
    touch,
    viewport: { width, height },
    batteryPresent,
  };
};
