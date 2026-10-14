import { useState, useEffect } from 'react';

export interface SystemSpecs {
  cpuCores: number;
  ramGB: number | null;
  gpuInfo: string;
  hasWebGPU: boolean;
  platform: string;
  userAgent: string;
  screenRes: string;
}

export function useSystemSpecs(): SystemSpecs {
  const [specs, setSpecs] = useState<SystemSpecs>({
    cpuCores: navigator.hardwareConcurrency || 4,
    ramGB: (navigator as any).deviceMemory || null,
    gpuInfo: 'Unknown',
    hasWebGPU: false,
    platform: navigator.platform || 'Unknown',
    userAgent: navigator.userAgent,
    screenRes: `${window.screen.width}x${window.screen.height}`,
  });

  useEffect(() => {
    // Detect GPU via WebGL
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl && gl instanceof WebGLRenderingContext) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          setSpecs(prev => ({ ...prev, gpuInfo: renderer }));
        }
      }
    } catch {
      // WebGL not available
    }

    // Check WebGPU
    if ('gpu' in navigator) {
      setSpecs(prev => ({ ...prev, hasWebGPU: true }));
    }
  }, []);

  return specs;
}

export function estimateVRAM(gpuInfo: string): number | null {
  const gpu = gpuInfo.toLowerCase();
  // Rough estimates based on common GPUs
  if (gpu.includes('rtx 4090')) return 24;
  if (gpu.includes('rtx 4080')) return 16;
  if (gpu.includes('rtx 4070')) return 12;
  if (gpu.includes('rtx 4060')) return 8;
  if (gpu.includes('rtx 3090')) return 24;
  if (gpu.includes('rtx 3080')) return 10;
  if (gpu.includes('rtx 3070')) return 8;
  if (gpu.includes('rtx 3060')) return 12;
  if (gpu.includes('rtx 2080')) return 8;
  if (gpu.includes('rtx 2060')) return 6;
  if (gpu.includes('gtx 1660')) return 6;
  if (gpu.includes('gtx 1080')) return 8;
  if (gpu.includes('gtx 1070')) return 8;
  if (gpu.includes('gtx 1060')) return 6;
  if (gpu.includes('rx 7900')) return 20;
  if (gpu.includes('rx 7800')) return 16;
  if (gpu.includes('rx 7600')) return 8;
  if (gpu.includes('rx 6800')) return 16;
  if (gpu.includes('rx 6700')) return 12;
  if (gpu.includes('intel') && gpu.includes('arc')) return 16;
  if (gpu.includes('intel')) return 2; // Integrated
  if (gpu.includes('apple') || gpu.includes('m1') || gpu.includes('m2') || gpu.includes('m3')) return 16;
  return null;
}

export function canRunModel(specs: SystemSpecs, modelSizeGB: number): boolean {
  const vram = estimateVRAM(specs.gpuInfo);
  if (vram !== null) {
    return vram >= modelSizeGB;
  }
  // Fallback: check RAM
  if (specs.ramGB !== null) {
    return specs.ramGB >= modelSizeGB * 1.5; // CPU inference needs more RAM
  }
  return specs.cpuCores >= 4 && modelSizeGB <= 4;
}
