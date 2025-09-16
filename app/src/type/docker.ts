// types/docker.ts
export interface ContainerState {
  Status: string;
  Running: boolean;
  Paused: boolean;
  Restarting: boolean;
  OOMKilled: boolean;
  Dead: boolean;
  Pid: number;
  ExitCode: number;
  Error?: string;
  StartedAt: string;
  FinishedAt: string;
}
export interface PortBinding {
  HostIp: string;
  HostPort: string;
}

export interface Mount {
  Type: string;
  Name?: string;
  Source: string;
  Destination: string;
  Driver?: string;
  Mode: string;
  RW: boolean;
}
export interface NetworkInfo {
  IPAMConfig: unknown | null;
  Links: string[] | null;
  Aliases: string[];
  MacAddress: string;
  NetworkID: string;
  EndpointID: string;
  Gateway: string;
  IPAddress: string;
  IPPrefixLen: number;
  IPv6Gateway: string;
  GlobalIPv6Address: string;
  GlobalIPv6PrefixLen: number;
  DriverOpts: Record<string, string> | null;
  DNSNames: string[];
}
export interface NetworkSettings {
  Networks: Record<string, NetworkInfo>;
  Ports?: Record<string, PortBinding[]>; // optional
  Bridge: string;
  SandboxID: string;
  SandboxKey: string;
}

export interface ContainerConfig {
  Hostname: string;
  Domainname: string;
  User: string;
  AttachStdin: boolean;
  AttachStdout: boolean;
  AttachStderr: boolean;
  Tty: boolean;
  Cmd?: string[];
  Entrypoint?: string[]; // added
  Env?: string[];
  Image: string;
  WorkingDir?: string;
  Labels?: Record<string, string>;
  ExposedPorts?: Record<string, unknown>; // add exposed ports
}
export interface ContainerHostConfig {
  CpuShares: number;
  NanoCpus: number;
  CpusetCpus: string;
  CpuCount: number;
  CpuPercent: number;
  Memory: number; // bytes
  MemorySwap: number; // bytes
  ShmSize: number;
  // add more if needed
}
export interface ContainerStats {
  cpu: { percent: number };
  memory: { usage: number; limit: number; percent: number };
  network: { rx_bytes: number; tx_bytes: number };
}

export interface ContainerJSON {
  Id: string;
  Name: string;
  Image: string;
  State: ContainerState;
  Config: ContainerConfig;
  Mounts: Mount[];
  NetworkSettings: NetworkSettings;
  HostConfig: ContainerHostConfig;
  LogPath: string;
  Platform: string;
  GraphDriver: { Name: string };
}
