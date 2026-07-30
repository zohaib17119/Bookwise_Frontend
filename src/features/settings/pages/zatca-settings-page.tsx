import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { apiClient } from "@/lib/api/client";
import { getApiErrorMessage } from "@/lib/api/error";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { FormField } from "@/components/shared/form-field";

type ZatcaConfig = {
  environment?: "SANDBOX" | "PRODUCTION";
  vatNumber?: string | null;
  organizationName?: string | null;
  organizationUnit?: string | null;
  invoiceProfile?: "SIMPLIFIED" | "STANDARD" | "BOTH";
  solutionName?: string | null;
  isEnabled?: boolean;
  streetName?: string | null;
  buildingNumber?: string | null;
  district?: string | null;
  city?: string | null;
  postalCode?: string | null;
  crNumber?: string | null;
  defaultDeviceId?: string | null;
};

type ZatcaDevice = {
  id: string;
  deviceName: string;
  serialNumber: string | null;
  commonName: string | null;
  complianceRequestId: string | null;
  hasCsr: boolean;
  hasComplianceCsid: boolean;
  hasProductionCsid: boolean;
  complianceChecksPassed: boolean;
  invoiceCounter: number;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type ZatcaMeta = {
  zatcaMock: boolean;
  canEnableReporting: boolean;
  environmentLabel?: string;
  environmentLocked?: boolean;
  defaultDeviceId?: string | null;
};

const emptyConfig: ZatcaConfig = {
  environment: "SANDBOX",
  invoiceProfile: "SIMPLIFIED",
  solutionName: "BooksWise",
  isEnabled: false,
};

function isValidVat(vat: string) {
  return /^\d{15}$/.test(vat) && vat.startsWith("3") && vat.endsWith("3");
}

export function ZatcaSettingsPage() {
  const { companyId = "" } = useParams();
  const [config, setConfig] = useState<ZatcaConfig>(emptyConfig);
  const [devices, setDevices] = useState<ZatcaDevice[]>([]);
  const [meta, setMeta] = useState<ZatcaMeta>({ zatcaMock: true, canEnableReporting: false });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [onboarding, setOnboarding] = useState(false);
  const [producingId, setProducingId] = useState<string | null>(null);
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);

  const [deviceName, setDeviceName] = useState("POS Terminal 1");
  const [otp, setOtp] = useState("");
  const [commonName, setCommonName] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [location, setLocation] = useState("");
  const [industry, setIndustry] = useState("");

  const settingsReady = useMemo(() => {
    return Boolean(config.organizationName?.trim()) && isValidVat(config.vatNumber?.trim() ?? "");
  }, [config.organizationName, config.vatNumber]);

  const activeDevices = useMemo(() => devices.filter((d) => d.isActive), [devices]);

  const load = useCallback(async () => {
    if (!companyId) return;
    const { data } = await apiClient.get<{
      config: ZatcaConfig | null;
      devices: ZatcaDevice[];
      meta: ZatcaMeta;
    }>(`/companies/${companyId}/zatca/config`);
    setConfig({ ...emptyConfig, ...(data?.config ?? {}) });
    setDevices(data?.devices ?? []);
    setMeta(data?.meta ?? { zatcaMock: true, canEnableReporting: false });
  }, [companyId]);

  useEffect(() => {
    void load().catch((err) => setError(getApiErrorMessage(err)));
  }, [load]);

  const buildSavePayload = () => ({
    environment: config.environment ?? "SANDBOX",
    vatNumber: config.vatNumber?.trim(),
    organizationName: config.organizationName?.trim(),
    organizationUnit: config.organizationUnit?.trim() || undefined,
    invoiceProfile: config.invoiceProfile ?? "SIMPLIFIED",
    solutionName: config.solutionName?.trim() || "BooksWise",
    isEnabled: Boolean(config.isEnabled),
    streetName: config.streetName?.trim() || undefined,
    buildingNumber: config.buildingNumber?.trim() || undefined,
    district: config.district?.trim() || undefined,
    city: config.city?.trim() || undefined,
    postalCode: config.postalCode?.trim() || undefined,
    crNumber: config.crNumber?.trim() || undefined,
    defaultDeviceId: config.defaultDeviceId ?? null,
  });

  const onSave = async () => {
    if (saving) return;
    setError(null);
    setMessage(null);

    const vat = config.vatNumber?.trim() ?? "";
    if (!vat) {
      setError("VAT number is required");
      return;
    }
    if (!isValidVat(vat)) {
      setError("VAT must be 15 digits, starting and ending with 3 (example: 300000000000003)");
      return;
    }
    if (!config.organizationName?.trim()) {
      setError("Organization name is required");
      return;
    }
    if (!companyId) {
      setError("Missing companyId in URL — open ZATCA from company settings again");
      return;
    }

    setSaving(true);
    try {
      const { data } = await apiClient.patch<ZatcaConfig>(
        `/companies/${companyId}/zatca/config`,
        buildSavePayload(),
      );
      setConfig({ ...emptyConfig, ...data });
      setMessage(
        data.isEnabled
          ? "ZATCA settings saved. Compliance will run when you send invoices."
          : "ZATCA settings saved. You can onboard a device next.",
      );
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const onComplianceOnboard = async () => {
    if (onboarding) return;
    setError(null);
    setMessage(null);

    if (!settingsReady) {
      setError("Save valid VAT + organization name in step 1 first");
      return;
    }
    if (!otp.trim()) {
      setError("OTP is required");
      return;
    }
    if (!deviceName.trim()) {
      setError("Device name is required");
      return;
    }

    setOnboarding(true);
    try {
      const { data } = await apiClient.post<{
        compliance: { mocked?: boolean; requestId: string; dispositionMessage: string | null };
        csr: { egsSerial: string; invoiceTypeCode: string };
      }>(`/companies/${companyId}/zatca/devices/compliance-csid`, {
        deviceName,
        otp,
        commonName: commonName || undefined,
        serialNumber: serialNumber || undefined,
        location: location || undefined,
        industry: industry || undefined,
        organizationUnit: config.organizationUnit || undefined,
      });
      setOtp("");
      setMessage(
        data.compliance.mocked
          ? `Mock Compliance CSID issued (${data.compliance.requestId}). For real Simulation set ZATCA_MOCK=false and restart API.`
          : `Compliance CSID issued (${data.compliance.dispositionMessage ?? "OK"}). EGS: ${data.csr.egsSerial}`,
      );
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setOnboarding(false);
    }
  };

  const onProductionOnboard = async (deviceId: string) => {
    setProducingId(deviceId);
    setError(null);
    setMessage(null);
    try {
      const { data } = await apiClient.post<{
        production: { mocked?: boolean; requestId: string; dispositionMessage: string | null };
      }>(`/companies/${companyId}/zatca/devices/${deviceId}/production-csid`);
      setMessage(
        data.production.mocked
          ? `Mock Production CSID issued (${data.production.requestId}).`
          : `Production CSID issued (${data.production.dispositionMessage ?? "OK"}). Compliance invoice checks run automatically before PCSID.`,
      );
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setProducingId(null);
    }
  };

  const onDeactivateDevice = async (deviceId: string) => {
    setDeactivatingId(deviceId);
    setError(null);
    try {
      await apiClient.post(`/companies/${companyId}/zatca/devices/${deviceId}/deactivate`);
      setMessage("Device deactivated. Reporting disabled if no other active PCSID devices remain.");
      await load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setDeactivatingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="ZATCA e-invoicing"
        description="Save taxpayer + national address → Compliance CSID (Fatoora OTP) → Production CSID → enable reporting."
      />
      {error ? <Alert variant="destructive" title={error} /> : null}
      {message ? <Alert title={message} /> : null}
      {meta.zatcaMock ? (
        <Alert
          title="ZATCA_MOCK is on (local only)"
          description="CSIDs and invoice submit are mocked for development. Set ZATCA_MOCK=false and use Fatoora Simulation (portal OTP) for real onboarding."
        />
      ) : (
        <Alert
          title={`Live Fatoora API — ${meta.environmentLabel ?? "Simulation/Production"}`}
          description="Get OTP from the Fatoora portal for your environment. Compliance invoice checks run automatically before Production CSID."
        />
      )}
      {meta.environmentLocked ? (
        <Alert
          title="Environment locked"
          description="Simulation/Production cannot be changed while onboarded devices exist. Deactivate devices first to switch environment."
        />
      ) : null}

      <section className="surface grid max-w-3xl gap-4 border border-slate-200 p-6">
        <div>
          <h2 className="text-base font-semibold text-slate-900">1. Taxpayer &amp; address</h2>
          <p className="mt-1 text-sm text-slate-600">
            Required for UBL BR when submitting to Fatoora (building 4 digits, postal 5 digits).
          </p>
        </div>
        <FormField label="VAT number (15 digits, start & end with 3)">
          <Input
            value={config.vatNumber ?? ""}
            onChange={(e) => setConfig((c) => ({ ...c, vatNumber: e.target.value }))}
            placeholder="3xxxxxxxxxxxxxx3"
          />
        </FormField>
        <FormField label="Organization name">
          <Input
            value={config.organizationName ?? ""}
            onChange={(e) => setConfig((c) => ({ ...c, organizationName: e.target.value }))}
          />
        </FormField>
        <FormField label="CR number (optional)">
          <Input
            value={config.crNumber ?? ""}
            onChange={(e) => setConfig((c) => ({ ...c, crNumber: e.target.value }))}
            placeholder="Commercial registration"
          />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Street">
            <Input
              value={config.streetName ?? ""}
              onChange={(e) => setConfig((c) => ({ ...c, streetName: e.target.value }))}
            />
          </FormField>
          <FormField label="Building (4 digits)">
            <Input
              value={config.buildingNumber ?? ""}
              onChange={(e) => setConfig((c) => ({ ...c, buildingNumber: e.target.value }))}
              placeholder="1234"
            />
          </FormField>
          <FormField label="District">
            <Input
              value={config.district ?? ""}
              onChange={(e) => setConfig((c) => ({ ...c, district: e.target.value }))}
            />
          </FormField>
          <FormField label="City">
            <Input
              value={config.city ?? ""}
              onChange={(e) => setConfig((c) => ({ ...c, city: e.target.value }))}
            />
          </FormField>
          <FormField label="Postal code (5 digits)">
            <Input
              value={config.postalCode ?? ""}
              onChange={(e) => setConfig((c) => ({ ...c, postalCode: e.target.value }))}
              placeholder="12345"
            />
          </FormField>
        </div>
        <FormField label="Organization unit / branch">
          <Input
            value={config.organizationUnit ?? ""}
            onChange={(e) => setConfig((c) => ({ ...c, organizationUnit: e.target.value }))}
          />
        </FormField>
        <FormField label="Solution name (EGS manufacturer)">
          <Input
            value={config.solutionName ?? "BooksWise"}
            onChange={(e) => setConfig((c) => ({ ...c, solutionName: e.target.value }))}
          />
        </FormField>
        <FormField label="Environment">
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
            disabled={meta.environmentLocked}
            value={config.environment ?? "SANDBOX"}
            onChange={(e) =>
              setConfig((c) => ({ ...c, environment: e.target.value as ZatcaConfig["environment"] }))
            }
          >
            <option value="SANDBOX">Simulation</option>
            <option value="PRODUCTION">Production</option>
          </select>
        </FormField>
        <FormField label="Invoice profile">
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={config.invoiceProfile ?? "SIMPLIFIED"}
            onChange={(e) =>
              setConfig((c) => ({
                ...c,
                invoiceProfile: e.target.value as ZatcaConfig["invoiceProfile"],
              }))
            }
          >
            <option value="SIMPLIFIED">Simplified (B2C reporting)</option>
            <option value="STANDARD">Standard (B2B clearance)</option>
            <option value="BOTH">Both</option>
          </select>
        </FormField>
        {activeDevices.length > 0 ? (
          <FormField label="Default device for invoice submit">
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={config.defaultDeviceId ?? ""}
              onChange={(e) =>
                setConfig((c) => ({ ...c, defaultDeviceId: e.target.value || null }))
              }
            >
              <option value="">Latest active PCSID device</option>
              {activeDevices
                .filter((d) => d.hasProductionCsid)
                .map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.deviceName}
                  </option>
                ))}
            </select>
          </FormField>
        ) : null}
        <label className="flex flex-wrap items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={Boolean(config.isEnabled)}
            disabled={!meta.canEnableReporting && !config.isEnabled}
            onChange={(e) => setConfig((c) => ({ ...c, isEnabled: e.target.checked }))}
          />
          Enable ZATCA compliance on invoice send
          {!meta.canEnableReporting ? (
            <span className="text-slate-500">(needs Production CSID first)</span>
          ) : null}
        </label>
        <div>
          <Button type="button" isLoading={saving} onClick={() => void onSave()}>
            Save ZATCA settings
          </Button>
        </div>
      </section>

      <section className="surface grid max-w-3xl gap-4 border border-emerald-200 bg-emerald-50/30 p-6">
        <div>
          <h2 className="text-base font-semibold text-slate-900">2. Onboard device (Compliance CSID)</h2>
          <p className="mt-1 text-sm text-slate-600">
            Use OTP from the <strong>Fatoora portal</strong> for Simulation or Production (not Developer Portal docs OTP).
          </p>
        </div>
        <FormField label="Device name">
          <Input value={deviceName} onChange={(e) => setDeviceName(e.target.value)} />
        </FormField>
        <FormField label="OTP from Fatoora portal">
          <Input
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Portal OTP"
            inputMode="numeric"
            autoComplete="one-time-code"
          />
        </FormField>
        <FormField label="Common name (optional)">
          <Input value={commonName} onChange={(e) => setCommonName(e.target.value)} />
        </FormField>
        <FormField label="Serial number (optional)">
          <Input value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} />
        </FormField>
        <FormField label="Location (optional)">
          <Input value={location} onChange={(e) => setLocation(e.target.value)} />
        </FormField>
        <FormField label="Industry (optional)">
          <Input value={industry} onChange={(e) => setIndustry(e.target.value)} />
        </FormField>
        <div>
          <Button
            type="button"
            isLoading={onboarding}
            disabled={!deviceName.trim() || !otp.trim() || !settingsReady}
            onClick={() => void onComplianceOnboard()}
          >
            Generate CSR &amp; request Compliance CSID
          </Button>
        </div>
      </section>

      <section className="surface grid max-w-3xl gap-4 border border-slate-200 p-6">
        <div>
          <h2 className="text-base font-semibold text-slate-900">3. Devices &amp; Production CSID</h2>
        </div>
        {devices.length === 0 ? (
          <p className="text-sm text-slate-600">No devices onboarded yet.</p>
        ) : (
          <ul className="divide-y divide-slate-200 rounded-md border border-slate-200 bg-white">
            {devices.map((device) => (
              <li key={device.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1 text-sm">
                  <p className="font-medium text-slate-900">
                    {device.deviceName}
                    {!device.isActive ? (
                      <span className="ml-2 text-slate-500">(inactive)</span>
                    ) : config.defaultDeviceId === device.id ? (
                      <span className="ml-2 text-emerald-700">(default)</span>
                    ) : null}
                  </p>
                  <p className="text-slate-600">
                    Compliance: {device.hasComplianceCsid ? "yes" : "no"} · Production:{" "}
                    {device.hasProductionCsid ? "yes" : "no"} · Checks:{" "}
                    {device.complianceChecksPassed ? "passed" : "pending"} · ICV: {device.invoiceCounter}
                  </p>
                  {device.expiresAt ? (
                    <p className="text-slate-500">PCSID expires: {new Date(device.expiresAt).toLocaleDateString()}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {device.isActive && device.hasComplianceCsid && !device.hasProductionCsid ? (
                    <Button
                      type="button"
                      variant="secondary"
                      isLoading={producingId === device.id}
                      onClick={() => void onProductionOnboard(device.id)}
                    >
                      Request Production CSID
                    </Button>
                  ) : null}
                  {device.isActive && device.hasProductionCsid ? (
                    <span className="self-center text-sm font-medium text-emerald-700">Ready</span>
                  ) : null}
                  {device.isActive ? (
                    <Button
                      type="button"
                      variant="ghost"
                      isLoading={deactivatingId === device.id}
                      onClick={() => void onDeactivateDevice(device.id)}
                    >
                      Deactivate
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
