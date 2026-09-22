import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiClient } from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/api/error";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { FormField } from "@/components/shared/form-field";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { queryClient } from "@/lib/query/query-client";
import { FbrMonitoringPanel } from "@/features/settings/components/fbr-monitoring-panel";
import { FbrSetupGuide } from "@/features/settings/components/fbr-setup-guide";
import {
  useFbrRefProvinces,
  useFbrRefSaleTypes,
  useSyncFbrReference,
} from "@/features/settings/hooks/use-fbr-reference";
import {
  ALL_FBR_SCENARIO_IDS,
  resolveFbrSectorDefaults,
} from "@/features/settings/utils/fbr-sector-defaults";
import { normalizeFbrNtnCnicInput } from "@/features/customers/schemas/customer.schema";

type FbrScenarioRequirement = {
  scenarioId: string;
  description: string;
  allowedSaleTypes: string[];
  sroRequired: boolean;
};

type FbrConfig = {
  environment: "SANDBOX" | "PRODUCTION";
  isEnabled: boolean;
  integrationStatus: "DISABLED" | "SETUP" | "ENABLED" | "ERROR";
  statusMessage?: string | null;
  sellerNTNCNIC?: string | null;
  sellerBusinessName?: string | null;
  sellerProvince?: string | null;
  sellerAddress?: string | null;
  defaultScenarioId?: string | null;
  fbrBusinessActivity?: string | null;
  fbrBusinessSector?: string | null;
  defaultSaleType?: string | null;
  suggestedScenarioIds?: string[];
  allScenarioIds?: string[];
  scenarioRequirements?: FbrScenarioRequirement[];
  currentScenarioRequirement?: FbrScenarioRequirement | null;
  hasSandboxToken?: boolean;
  hasProductionToken?: boolean;
  hasTokenForEnvironment?: boolean;
  lastConnectionTestAt?: string | null;
  lastConnectionTestOk?: boolean | null;
  lastConnectionTestMessage?: string | null;
};

type OnboardingStep = {
  id: string;
  label: string;
  done: boolean;
};

type FbrMeta = {
  countryRestrictedTo: string;
  liveSubmitAvailable: boolean;
  defaultEnabled: boolean;
  whitelistIps?: string[];
  irisPortalUrl?: string;
  businessActivities?: string[];
  businessSectors?: string[];
  onboarding?: {
    authModel: string;
    documentationHint: string;
    steps: OnboardingStep[];
    completedCount: number;
    totalCount: number;
  };
  readiness?: {
    documentation?: {
      sandboxSmoke?: string;
      productionReadiness?: string;
      officialDiHint?: string;
    };
    sandboxTestCases?: Array<{
      id: string;
      title: string;
      proveHow: string;
      unitCovered: boolean;
    }>;
    supportedInvoiceTypes?: string[];
    knownLimitations?: string[];
    productionGate?: string;
    fbrMock?: boolean;
    liveSubmitAvailable?: boolean;
  };
};

const emptyConfig: FbrConfig = {
  environment: "SANDBOX",
  isEnabled: false,
  integrationStatus: "DISABLED",
  statusMessage: null,
  sellerNTNCNIC: "",
  sellerBusinessName: "",
  sellerProvince: "",
  sellerAddress: "",
  defaultScenarioId: "",
  fbrBusinessActivity: "",
  fbrBusinessSector: "",
  defaultSaleType: "",
  suggestedScenarioIds: [],
  allScenarioIds: [...ALL_FBR_SCENARIO_IDS],
  scenarioRequirements: [],
  currentScenarioRequirement: null,
  hasSandboxToken: false,
  hasProductionToken: false,
  hasTokenForEnvironment: false,
  lastConnectionTestAt: null,
  lastConnectionTestOk: null,
  lastConnectionTestMessage: null,
};

const ACTIVITY_LABELS: Record<string, string> = {
  MANUFACTURER: "Manufacturer",
  IMPORTER: "Importer",
  DISTRIBUTOR: "Distributor",
  WHOLESALER: "Wholesaler",
  EXPORTER: "Exporter",
  RETAILER: "Retailer",
  SERVICE_PROVIDER: "Service provider",
  OTHER: "Other",
};

const SECTOR_LABELS: Record<string, string> = {
  ALL_OTHER: "All other / general",
  STEEL: "Steel",
  FMCG: "FMCG",
  TEXTILE: "Textile",
  TELECOM: "Telecom",
  PETROLEUM: "Petroleum",
  ELECTRICITY_DISTRIBUTION: "Electricity distribution",
  GAS_DISTRIBUTION: "Gas distribution",
  SERVICES: "Services",
  AUTOMOBILE: "Automobile",
  CNG_STATIONS: "CNG stations",
  PHARMACEUTICALS: "Pharmaceuticals",
  WHOLESALE_RETAIL: "Wholesale / retail",
};

export function FbrSettingsPage() {
  const { companyId = "" } = useParams();
  const [config, setConfig] = useState<FbrConfig>(emptyConfig);
  const [meta, setMeta] = useState<FbrMeta>({
    countryRestrictedTo: "PK",
    liveSubmitAvailable: false,
    defaultEnabled: false,
    whitelistIps: [],
  });
  const [sandboxToken, setSandboxToken] = useState("");
  const [productionToken, setProductionToken] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const provincesQuery = useFbrRefProvinces(companyId, "", Boolean(companyId));
  const saleTypesQuery = useFbrRefSaleTypes(companyId, Boolean(companyId));
  const syncReferenceMutation = useSyncFbrReference(companyId);

  const applyConfig = (next: FbrConfig) => {
    setConfig({
      environment: next.environment ?? "SANDBOX",
      isEnabled: Boolean(next.isEnabled),
      integrationStatus: next.integrationStatus ?? "DISABLED",
      statusMessage: next.statusMessage ?? null,
      sellerNTNCNIC: next.sellerNTNCNIC ?? "",
      sellerBusinessName: next.sellerBusinessName ?? "",
      sellerProvince: next.sellerProvince ?? "",
      sellerAddress: next.sellerAddress ?? "",
      defaultScenarioId: next.defaultScenarioId ?? "",
      fbrBusinessActivity: next.fbrBusinessActivity ?? "",
      fbrBusinessSector: next.fbrBusinessSector ?? "",
      defaultSaleType: next.defaultSaleType ?? "",
      suggestedScenarioIds: next.suggestedScenarioIds ?? [],
      allScenarioIds: next.allScenarioIds?.length
        ? next.allScenarioIds
        : [...ALL_FBR_SCENARIO_IDS],
      scenarioRequirements: next.scenarioRequirements ?? [],
      currentScenarioRequirement: next.currentScenarioRequirement ?? null,
      hasSandboxToken: Boolean(next.hasSandboxToken),
      hasProductionToken: Boolean(next.hasProductionToken),
      hasTokenForEnvironment: Boolean(next.hasTokenForEnvironment),
      lastConnectionTestAt: next.lastConnectionTestAt ?? null,
      lastConnectionTestOk: next.lastConnectionTestOk ?? null,
      lastConnectionTestMessage: next.lastConnectionTestMessage ?? null,
    });
  };

  const load = useCallback(async () => {
    setError(null);
    const { data } = await apiClient.get<{
      config: FbrConfig;
      meta: FbrMeta;
    }>(`/companies/${companyId}/fbr/config`);
    applyConfig(data?.config ?? emptyConfig);
    setMeta(
      data?.meta ?? {
        countryRestrictedTo: "PK",
        liveSubmitAvailable: false,
        defaultEnabled: false,
        whitelistIps: [],
      },
    );
    setSandboxToken("");
    setProductionToken("");
  }, [companyId]);

  useEffect(() => {
    void load().catch((err) => setError(getApiErrorMessage(err)));
  }, [load]);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const sellerNTNCNIC = config.sellerNTNCNIC
        ? normalizeFbrNtnCnicInput(config.sellerNTNCNIC) || null
        : null;
      const { data } = await apiClient.patch<FbrConfig>(`/companies/${companyId}/fbr/config`, {
        environment: config.environment,
        isEnabled: config.isEnabled,
        sellerNTNCNIC,
        sellerBusinessName: config.sellerBusinessName || null,
        sellerProvince: config.sellerProvince || null,
        sellerAddress: config.sellerAddress || null,
        defaultScenarioId: config.defaultScenarioId || null,
        fbrBusinessActivity: config.fbrBusinessActivity || null,
        fbrBusinessSector: config.fbrBusinessSector || null,
        defaultSaleType: config.defaultSaleType || null,
        ...(sandboxToken.trim() ? { sandboxToken: sandboxToken.trim() } : {}),
        ...(productionToken.trim() ? { productionToken: productionToken.trim() } : {}),
      });
      if (sellerNTNCNIC !== (config.sellerNTNCNIC ?? null)) {
        setConfig((current) => ({ ...current, sellerNTNCNIC: sellerNTNCNIC ?? "" }));
      }
      applyConfig(data ?? config);
      await queryClient.invalidateQueries({ queryKey: ["companies", companyId] });
      await load();
      setMessage(
        config.isEnabled
          ? "FBR settings saved. Issued invoices will enqueue to PRAL when a security token is configured for the selected environment."
          : "FBR settings saved. Digital Invoicing remains disabled for invoice send.",
      );
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const clearToken = async (which: "sandbox" | "production") => {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const { data } = await apiClient.patch<FbrConfig>(`/companies/${companyId}/fbr/config`, {
        ...(which === "sandbox" ? { clearSandboxToken: true } : { clearProductionToken: true }),
      });
      applyConfig(data ?? config);
      await load();
      setMessage(which === "sandbox" ? "Sandbox token cleared." : "Production token cleared.");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setMessage(null);
    setError(null);
    try {
      const { data } = await apiClient.post<{
        result: { ok: boolean; message: string; mocked?: boolean };
        config: FbrConfig;
      }>(`/companies/${companyId}/fbr/config/test-connection`, {
        environment: config.environment,
      });
      if (data?.config) applyConfig(data.config);
      await load();
      if (data?.result?.ok) {
        setMessage(data.result.message);
      } else {
        setError(data?.result?.message ?? "Connection test failed");
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setTesting(false);
    }
  };

  const refreshReferenceLists = async () => {
    setMessage(null);
    setError(null);
    try {
      const result = await syncReferenceMutation.mutateAsync();
      const parts = [
        `${result.provinces} provinces`,
        `${result.hsCodes} HS codes`,
        `${result.uoms} UoMs`,
        `${result.saleTypes} sale types`,
      ];
      setMessage(
        result.mocked
          ? `FBR reference lists refreshed (mock seed): ${parts.join(", ")}.`
          : `FBR reference lists refreshed: ${parts.join(", ")}.`,
      );
      if (result.errors?.length) {
        setError(result.errors.join("; "));
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const onboarding = meta.onboarding;
  const whitelistIps = meta.whitelistIps ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="FBR Digital Invoicing"
        description="Pakistan-only. Disabled by default. Auth uses an IRIS/PRAL security token (Bearer), not a username/password."
      />

      {error ? <Alert description={error} title="FBR settings" variant="destructive" /> : null}
      {message ? <Alert description={message} title="Saved" /> : null}

      {!meta.liveSubmitAvailable ? (
        <Alert
          description="FBR_MOCK is on for this backend — submissions are simulated. Turn FBR_MOCK off to post to official PRAL sandbox/production URLs."
          title="Mock FBR submit mode"
        />
      ) : (
        <Alert
          description={
            whitelistIps.length
              ? "Live PRAL submit is available. Whitelist the BooksWise server IP shown in the guide below in IRIS, then paste your token and enable Digital Invoicing."
              : "Live PRAL submit is available. Whitelist the BooksWise server IP in IRIS (ask support if the IP is not shown), then paste your token and enable Digital Invoicing."
          }
          title="Live FBR Digital Invoicing available"
        />
      )}

      <FbrSetupGuide irisPortalUrl={meta.irisPortalUrl} whitelistIps={whitelistIps} />

      <div className="surface space-y-4 p-6">
        <h2 className="text-sm font-semibold">FBR configuration</h2>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            helperText="IRIS-style activity. Sets suggested sandbox scenarios and default item sale type (editable per item)."
            label="Business activity"
          >
            <Select
              onChange={(event) => {
                const fbrBusinessActivity = event.target.value;
                setConfig((current) => {
                  const defaults = resolveFbrSectorDefaults({
                    activity: fbrBusinessActivity,
                    sector: current.fbrBusinessSector,
                  });
                  return {
                    ...current,
                    fbrBusinessActivity,
                    defaultSaleType: defaults.defaultSaleType,
                    defaultScenarioId: defaults.defaultScenarioId,
                    suggestedScenarioIds: defaults.suggestedScenarioIds,
                  };
                });
              }}
              value={config.fbrBusinessActivity ?? ""}
            >
              <option value="">Select activity…</option>
              {(meta.businessActivities ?? Object.keys(ACTIVITY_LABELS)).map((value) => (
                <option key={value} value={value}>
                  {ACTIVITY_LABELS[value] ?? value}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField
            helperText="IRIS sector (Petroleum, Steel, FMCG…). Does not lock sale type — only defaults."
            label="Business sector"
          >
            <Select
              onChange={(event) => {
                const fbrBusinessSector = event.target.value;
                setConfig((current) => {
                  const defaults = resolveFbrSectorDefaults({
                    activity: current.fbrBusinessActivity,
                    sector: fbrBusinessSector,
                  });
                  return {
                    ...current,
                    fbrBusinessSector,
                    defaultSaleType: defaults.defaultSaleType,
                    defaultScenarioId: defaults.defaultScenarioId,
                    suggestedScenarioIds: defaults.suggestedScenarioIds,
                  };
                });
              }}
              value={config.fbrBusinessSector ?? ""}
            >
              <option value="">Select sector…</option>
              {(meta.businessSectors ?? Object.keys(SECTOR_LABELS)).map((value) => (
                <option key={value} value={value}>
                  {SECTOR_LABELS[value] ?? value}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField
            helperText="Pre-filled on new items when Digital Invoicing is on. Full FBR saleType list (synced + BooksWise catalog)."
            label="Default sale type"
          >
            <Select
              onChange={(event) =>
                setConfig((current) => ({ ...current, defaultSaleType: event.target.value }))
              }
              value={config.defaultSaleType ?? ""}
            >
              <option value="">Select sale type…</option>
              {(saleTypesQuery.data ?? []).map((row) => (
                <option key={row.id ?? row.description} value={row.description}>
                  {row.description}
                </option>
              ))}
              {config.defaultSaleType &&
              !(saleTypesQuery.data ?? []).some((row) => row.description === config.defaultSaleType) ? (
                <option value={config.defaultSaleType}>{config.defaultSaleType}</option>
              ) : null}
            </Select>
          </FormField>
          <FormField
            helperText={(() => {
              const req =
                config.currentScenarioRequirement ??
                config.scenarioRequirements?.find((r) => r.scenarioId === config.defaultScenarioId);
              if (req) {
                const sales = req.allowedSaleTypes.slice(0, 3).join("; ");
                const sro = req.sroRequired ? " SRO schedule + item serial required." : "";
                return `${req.description}. Allowed sale type(s): ${sales}.${sro}`;
              }
              return (config.suggestedScenarioIds?.length ?? 0) > 0
                ? `Suggested for your activity/sector: ${config.suggestedScenarioIds!.join(", ")}`
                : "Full SN001–SN028 list. Required for Sandbox posts.";
            })()}
            label="Default scenario ID"
          >
            <Select
              onChange={(event) =>
                setConfig((current) => {
                  const id = event.target.value;
                  const req =
                    current.scenarioRequirements?.find((row) => row.scenarioId === id) ?? null;
                  return {
                    ...current,
                    defaultScenarioId: id,
                    currentScenarioRequirement: req,
                  };
                })
              }
              value={config.defaultScenarioId ?? ""}
            >
              <option value="">Select scenario…</option>
              {(config.allScenarioIds?.length
                ? config.allScenarioIds
                : [...ALL_FBR_SCENARIO_IDS]
              ).map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <FormField
          helperText="Current integration status for this company (updated when you save or test connection)."
          label="Integration status"
        >
          <p className="text-sm font-medium">{config.integrationStatus}</p>
          {config.statusMessage ? (
            <p className="mt-1 text-xs text-muted-foreground">{config.statusMessage}</p>
          ) : null}
        </FormField>

        <FormField
          helperText="Sandbox = FBR test environment. Production = live Digital Invoicing. Stay on Sandbox until IRIS sandbox works."
          label="Environment"
        >
          <select
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            onChange={(event) =>
              setConfig((current) => ({
                ...current,
                environment: event.target.value as FbrConfig["environment"],
              }))
            }
            value={config.environment}
          >
            <option value="SANDBOX">Sandbox</option>
            <option value="PRODUCTION">Production</option>
          </select>
        </FormField>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            helperText="FBR DI: C831684-3 → C831684 (letter kept). Falls back to company tax registration if empty."
            label="Seller NTN / CNIC"
          >
            <Input
              onBlur={() => {
                const cleaned = normalizeFbrNtnCnicInput(config.sellerNTNCNIC);
                if (cleaned !== (config.sellerNTNCNIC ?? "")) {
                  setConfig((current) => ({ ...current, sellerNTNCNIC: cleaned }));
                }
              }}
              onChange={(event) =>
                setConfig((current) => ({ ...current, sellerNTNCNIC: event.target.value }))
              }
              placeholder="e.g. C831684-3 or C831684"
              value={config.sellerNTNCNIC ?? ""}
            />
          </FormField>
          <FormField
            helperText="Legal seller name on FBR invoices. Falls back to company legal name if empty."
            label="Seller business name"
          >
            <Input
              onChange={(event) =>
                setConfig((current) => ({ ...current, sellerBusinessName: event.target.value }))
              }
              placeholder="Fallback: company legal name"
              value={config.sellerBusinessName ?? ""}
            />
          </FormField>
          <FormField
            helperText="Seller province as FBR expects (from FBR province reference)."
            label="Seller province"
          >
            <Select
              onChange={(event) =>
                setConfig((current) => ({ ...current, sellerProvince: event.target.value }))
              }
              value={config.sellerProvince ?? ""}
            >
              <option value="">Select province…</option>
              {config.sellerProvince &&
              !(provincesQuery.data ?? []).some((p) => p.description === config.sellerProvince) ? (
                <option value={config.sellerProvince}>{config.sellerProvince}</option>
              ) : null}
              {(provincesQuery.data ?? []).map((province) => (
                <option key={province.id} value={province.description}>
                  {province.description}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <FormField
          helperText="Seller address line sent to FBR. Falls back to company address if empty."
          label="Seller address"
        >
          <Input
            onChange={(event) =>
              setConfig((current) => ({ ...current, sellerAddress: event.target.value }))
            }
            placeholder="Fallback: company address"
            value={config.sellerAddress ?? ""}
          />
        </FormField>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            helperText={
              config.hasSandboxToken
                ? "Configured (encrypted). Leave blank to keep; paste a new value to replace. Token is never shown again after save."
                : "Paste the Sandbox security token from IRIS Digital Invoicing (Bearer credential)."
            }
            label="Sandbox security token"
          >
            <Input
              autoComplete="off"
              onChange={(event) => setSandboxToken(event.target.value)}
              placeholder={config.hasSandboxToken ? "•••••••• (configured)" : "Paste sandbox token"}
              type="password"
              value={sandboxToken}
            />
            {config.hasSandboxToken ? (
              <Button
                className="mt-2"
                disabled={saving}
                onClick={() => void clearToken("sandbox")}
                type="button"
                variant="ghost"
              >
                Clear sandbox token
              </Button>
            ) : null}
          </FormField>
          <FormField
            helperText={
              config.hasProductionToken
                ? "Configured (encrypted). Leave blank to keep; paste a new value to replace."
                : "Paste only after IRIS sandbox scenarios succeed. Do not use for first-time testing."
            }
            label="Production security token"
          >
            <Input
              autoComplete="off"
              onChange={(event) => setProductionToken(event.target.value)}
              placeholder={
                config.hasProductionToken ? "•••••••• (configured)" : "Paste production token"
              }
              type="password"
              value={productionToken}
            />
            {config.hasProductionToken ? (
              <Button
                className="mt-2"
                disabled={saving}
                onClick={() => void clearToken("production")}
                type="button"
                variant="ghost"
              >
                Clear production token
              </Button>
            ) : null}
          </FormField>
        </div>

        <FormField
          helperText="Probes FBR with your token for the selected environment (provinces API). Run this before enabling."
          label="Last connection test"
        >
          <p className="text-sm">
            {config.lastConnectionTestAt
              ? `${config.lastConnectionTestOk ? "OK" : "Failed"} · ${new Date(
                  config.lastConnectionTestAt,
                ).toLocaleString()}`
              : "Not run yet"}
          </p>
          {config.lastConnectionTestMessage ? (
            <p className="mt-1 text-xs text-muted-foreground">{config.lastConnectionTestMessage}</p>
          ) : null}
          <Button
            className="mt-3"
            disabled={
              testing ||
              saving ||
              !(config.environment === "PRODUCTION"
                ? config.hasProductionToken
                : config.hasSandboxToken)
            }
            isLoading={testing}
            onClick={() => void testConnection()}
            type="button"
            variant="secondary"
          >
            Test {config.environment.toLowerCase()} connection
          </Button>
          <Button
            className="mt-3 ml-2"
            disabled={syncReferenceMutation.isPending || saving}
            isLoading={syncReferenceMutation.isPending}
            onClick={() => void refreshReferenceLists()}
            type="button"
            variant="secondary"
          >
            Refresh FBR lists
          </Button>
        </FormField>

        <div className="flex items-start gap-3 rounded-xl border bg-white px-4 py-3">
          <Checkbox
            checked={config.isEnabled}
            onChange={(event) =>
              setConfig((current) => ({
                ...current,
                isEnabled: event.target.checked,
              }))
            }
          />
          <div>
            <p className="text-sm font-medium">Enable FBR Digital Invoicing</p>
            <p className="text-xs text-muted-foreground">
              Off by default. Requires a security token for the selected environment. When enabled,
              issuing an invoice/credit/debit note queues Digital Invoicing submit to PRAL.
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button isLoading={saving} onClick={() => void save()} type="button">
            Save FBR settings
          </Button>
        </div>
      </div>

      {companyId ? <FbrMonitoringPanel companyId={companyId} /> : null}

      {meta.readiness ? (
        <div className="surface space-y-3 p-6">
          <h2 className="text-sm font-semibold">Sandbox / production readiness</h2>
          <p className="text-xs text-muted-foreground">{meta.readiness.productionGate}</p>
          <p className="text-xs text-muted-foreground">
            Supported DI types: {(meta.readiness.supportedInvoiceTypes ?? []).join(", ") || "—"}.
          </p>
          <ol className="max-h-56 space-y-2 overflow-y-auto text-sm">
            {(meta.readiness.sandboxTestCases ?? []).map((testCase, index) => (
              <li className="rounded-lg border border-border/60 px-3 py-2" key={testCase.id}>
                <p className="font-medium">
                  {index + 1}. {testCase.title}
                  {testCase.unitCovered ? (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      unit covered
                    </span>
                  ) : null}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{testCase.proveHow}</p>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      {onboarding ? (
        <div className="surface space-y-3 p-6">
          <h2 className="text-sm font-semibold">Checklist status</h2>
          <p className="text-xs text-muted-foreground">
            {onboarding.documentationHint} · {onboarding.completedCount}/{onboarding.totalCount}{" "}
            steps ready
          </p>
          <ol className="space-y-2 text-sm">
            {onboarding.steps.map((step) => (
              <li className="flex gap-2" key={step.id}>
                <span className={step.done ? "text-emerald-700" : "text-muted-foreground"}>
                  {step.done ? "✓" : "○"}
                </span>
                <span>{step.label}</span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  );
}
