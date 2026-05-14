import type { SupabaseClient } from "@supabase/supabase-js";

type GenericRow = Record<string, any>;

const STATUS_MAP: Record<string, "RUNNING" | "WARNING" | "ALARM" | "STOP"> = {
  run: "RUNNING",
  running: "RUNNING",
  active: "RUNNING",
  online: "RUNNING",
  ok: "RUNNING",
  normal: "RUNNING",
  warning: "WARNING",
  warn: "WARNING",
  idle: "WARNING",
  alert: "WARNING",
  alarm: "ALARM",
  critical: "ALARM",
  error: "ALARM",
  fault: "ALARM",
  stop: "STOP",
  stopped: "STOP",
  down: "STOP",
  offline: "STOP",
  inactive: "STOP",
};

const normalizeStatus = (value: unknown): "RUNNING" | "WARNING" | "ALARM" | "STOP" => {
  const key = String(value ?? "").trim().toLowerCase();
  return STATUS_MAP[key] ?? "STOP";
};

const timestampOf = (row: GenericRow | null | undefined) => {
  if (!row) return 0;
  const value =
    row.updated_at ??
    row.timestamp ??
    row.start_time ??
    row.created_at ??
    row.date ??
    null;
  return value ? new Date(value).getTime() : 0;
};

const numberOf = (...values: unknown[]) => {
  for (const value of values) {
    if (value === null || value === undefined || value === "") continue;
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return 0;
};

const textOf = (...values: unknown[]) => {
  for (const value of values) {
    if (value === null || value === undefined) continue;
    const text = String(value).trim();
    if (text) return text;
  }
  return "";
};

const inferZone = (machine: GenericRow) => {
  const raw = [
    machine.zone,
    machine.area,
    machine.location,
    machine.section,
    machine.line,
    machine.line_name,
    machine.code,
    machine.name,
  ]
    .filter(Boolean)
    .join(" ")
    .toUpperCase();

  if (raw.includes("BAND") || raw.includes("PLY") || raw.includes(" I/L") || raw.startsWith("I/L")) return "BAND";
  if (
    raw.includes("1ST") ||
    raw.includes("LET OFF") ||
    raw.includes("FRONT SERVER") ||
    raw.includes("SERVER FRONT")
  ) {
    return "1ST";
  }
  if (
    raw.includes("2ND") ||
    raw.includes("BT ") ||
    raw.includes("GT ") ||
    raw.includes("UNLOADER") ||
    raw.includes("REAR SERVER") ||
    raw.includes("FR MAIN")
  ) {
    return "2ND";
  }
  return textOf(machine.zone, machine.area, machine.location, "OTHER").toUpperCase();
};

export const useProductionDashboard = () => {
  const { $supabase } = useNuxtApp() as { $supabase: SupabaseClient };

  const resolve = async (promise: PromiseLike<any>) => {
    try {
      const result = await promise;
      return {
        data: result?.data ?? null,
        error: result?.error ?? null,
      };
    } catch (error) {
      return {
        data: null,
        error,
      };
    }
  };

  const load = async () => {
    const [
      machinesRes,
      alarmsRes,
      statusLogRes,
      oeeRes,
      machineStatusRes,
      productionDailyRes,
      movementRes,
      lossTimeRes,
      lineEfficiencyRes,
    ] = await Promise.all([
      resolve($supabase.from("machines").select("*").order("name")),
      resolve($supabase.from("machine_alarm").select("*").order("start_time", { ascending: false }).limit(200)),
      resolve($supabase.from("machine_status_log").select("*").order("timestamp", { ascending: false }).limit(500)),
      resolve($supabase.from("machine_oee_daily").select("*").order("date", { ascending: false }).limit(200)),
      resolve($supabase.from("machine_status").select("*").order("updated_at", { ascending: false }).limit(300)),
      resolve($supabase.from("production_daily").select("*").order("production_date", { ascending: false }).limit(1).maybeSingle()),
      resolve($supabase.from("movement_efficiency").select("hour, value, created_at, production_date").order("production_date", { ascending: false }).order("hour").limit(24)),
      resolve($supabase.from("loss_time").select("*").order("production_date", { ascending: false }).limit(1).maybeSingle()),
      resolve($supabase.from("line_efficiency").select("*").order("production_date", { ascending: false }).order("line_name").limit(100)),
    ]);

    const machines = machinesRes.data ?? [];
    const alarms = alarmsRes.data ?? [];
    const statusLogs = statusLogRes.data ?? [];
    const oeeRows = oeeRes.data ?? [];
    const machineStatuses = machineStatusRes.data ?? [];
    const movement = (movementRes.data ?? []).slice().reverse();
    const lineEfficiency = lineEfficiencyRes.data ?? [];
    const productionDaily = productionDailyRes.data ?? null;
    const lossTime = lossTimeRes.data ?? null;

    const latestStatusByMachine = new Map<string, GenericRow>();
    for (const row of statusLogs) {
      const machineId = textOf(row?.machine_id);
      if (!machineId || latestStatusByMachine.has(machineId)) continue;
      latestStatusByMachine.set(machineId, row);
    }

    const latestOeeByMachine = new Map<string, GenericRow>();
    for (const row of oeeRows) {
      const machineId = textOf(row?.machine_id);
      if (!machineId || latestOeeByMachine.has(machineId)) continue;
      latestOeeByMachine.set(machineId, row);
    }

    const activeAlarmByMachine = new Map<string, GenericRow>();
    const latestAlarmByMachine = new Map<string, GenericRow>();
    for (const row of alarms) {
      const machineId = textOf(row?.machine_id);
      if (!machineId) continue;
      if (!latestAlarmByMachine.has(machineId)) latestAlarmByMachine.set(machineId, row);
      if (!row?.end_time && !activeAlarmByMachine.has(machineId)) activeAlarmByMachine.set(machineId, row);
    }

    const statusOverview = {
      RUNNING: 0,
      WARNING: 0,
      ALARM: 0,
      STOP: 0,
    };

    const machineCards = machines.map((machine: GenericRow) => {
      const machineId = textOf(machine.id);
      const latestStatus = latestStatusByMachine.get(machineId);
      const latestOee = latestOeeByMachine.get(machineId);
      const activeAlarm = activeAlarmByMachine.get(machineId);
      const latestAlarm = latestAlarmByMachine.get(machineId);

      const status = activeAlarm
        ? "ALARM"
        : normalizeStatus(latestStatus?.status ?? machine.status);

      statusOverview[status] += 1;

      const oee = numberOf(
        latestOee?.oee,
        latestOee?.oee_percent,
        latestOee?.efficiency,
        latestStatus?.efficiency,
      );

      const performance = numberOf(latestOee?.performance);
      const availability = numberOf(latestOee?.availability);
      const quality = numberOf(latestOee?.quality);

      return {
        id: machine.id,
        name: textOf(machine.name, machine.code, machine.machine_name, "Unknown"),
        code: textOf(machine.code, machine.name),
        zone: inferZone(machine),
        spec: textOf(machine.spec, machine.model, machine.location, machine.line_name, "-"),
        status,
        latestStatus,
        latestAlarm: activeAlarm ?? latestAlarm ?? null,
        oee,
        performance,
        availability,
        quality,
        updatedAt: textOf(
          latestStatus?.timestamp,
          latestStatus?.updated_at,
          latestAlarm?.start_time,
          latestOee?.date,
        ),
      };
    });

    const recentProductionTable = machineCards
      .slice()
      .sort((a, b) => timestampOf(b.latestStatus) - timestampOf(a.latestStatus))
      .map((machine, index) => ({
        id: `${machine.id}-${index}`,
        machine: machine.name,
        zone: machine.zone,
        status: machine.status,
        oee: machine.oee,
        availability: machine.availability,
        performance: machine.performance,
        quality: machine.quality,
        updatedAt: machine.updatedAt,
        alarmCode: textOf(machine.latestAlarm?.alarm_code, machine.latestAlarm?.code, "-"),
        alarmName: textOf(machine.latestAlarm?.alarm_name, machine.latestAlarm?.name, "-"),
      }))
      .slice(0, 8);

    const lastActivityTimestamp = Math.max(
      timestampOf(productionDaily),
      ...machineCards.map((row) => timestampOf(row.latestStatus)),
      ...alarms.map((row) => timestampOf(row)),
      ...oeeRows.map((row) => timestampOf(row)),
    );

    const alarmsLast24Hours = alarms.filter((row) => {
      const ts = timestampOf(row);
      return ts > 0 && Date.now() - ts <= 24 * 60 * 60 * 1000;
    });

    const alarmTrendMap = new Map<string, number>();
    for (const row of alarmsLast24Hours) {
      const date = new Date(row.start_time ?? row.created_at ?? Date.now());
      const key = `${String(date.getHours()).padStart(2, "0")}:00`;
      alarmTrendMap.set(key, (alarmTrendMap.get(key) ?? 0) + 1);
    }

    const alarmTrend = Array.from(alarmTrendMap.entries())
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => a.hour.localeCompare(b.hour));

    const alarmByZoneMap = new Map<string, number>();
    for (const machine of machineCards) {
      const count = machine.latestAlarm ? 1 : 0;
      alarmByZoneMap.set(machine.zone, (alarmByZoneMap.get(machine.zone) ?? 0) + count);
    }

    const alarmByZone = Array.from(alarmByZoneMap.entries()).map(([zone, count]) => ({ zone, count }));

    const lineEfficiencySummary = lineEfficiency
      .map((row: GenericRow) => ({
        lineName: textOf(row.line_name, row.line, row.name, "Line"),
        efficiency: numberOf(row.efficiency, row.value, row.oee),
      }))
      .filter((row) => row.lineName);

    const oeeByMachine = machineCards
      .filter((row) => row.oee > 0)
      .slice()
      .sort((a, b) => b.oee - a.oee)
      .slice(0, 8)
      .map((row) => ({
        machine: row.name,
        oee: row.oee,
        status: row.status,
      }));

    const latestMachineStatusRows = machineStatuses.slice(0, 50).map((row: GenericRow) => ({
      ...row,
      status: normalizeStatus(row.status),
      station: textOf(row.station, row.machine_name, row.name, row.machine_id),
      line: textOf(row.line, row.line_name),
      efficiency: numberOf(row.efficiency, row.oee),
    }));

    return {
      machines,
      machineCards,
      alarms,
      activeAlarms: Array.from(activeAlarmByMachine.values()),
      statusLogs,
      oeeRows,
      machineStatuses: latestMachineStatusRows,
      productionDaily,
      movement,
      lossTime,
      lineEfficiency: lineEfficiencySummary,
      oeeByMachine,
      recentProductionTable,
      statusOverview,
      alarmTrend,
      alarmByZone,
      lastActivityTimestamp,
      errors: {
        machines: machinesRes.error,
        alarms: alarmsRes.error,
        statusLogs: statusLogRes.error,
        oee: oeeRes.error,
        machineStatus: machineStatusRes.error,
        productionDaily: productionDailyRes.error,
        movement: movementRes.error,
        lossTime: lossTimeRes.error,
        lineEfficiency: lineEfficiencyRes.error,
      },
      hasAnyData:
        machines.length > 0 ||
        alarms.length > 0 ||
        statusLogs.length > 0 ||
        oeeRows.length > 0 ||
        machineStatuses.length > 0 ||
        movement.length > 0 ||
        lineEfficiency.length > 0 ||
        !!productionDaily ||
        !!lossTime,
    };
  };

  return {
    load,
    normalizeStatus,
  };
};
