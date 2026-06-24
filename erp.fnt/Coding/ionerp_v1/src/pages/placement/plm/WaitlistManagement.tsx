import React from "react";
import DataTable from "../../../components/Table/DataTable";
import { toast } from "react-toastify";
import { useAxios } from "../../../hooks/useAxios";
import { ApiEndpoint } from "../../../utils/ApiEndpoint/emsapiEndpoint";
import axiosInstance from "../../../utils/api";

type Waitlist = {
  waitlist_id: number;
  application_id: number;
  student_name: string;
  drive_name: string;
  position: number;
  waitlisted_at: string;
  status: string; // WAITLISTED | PROMOTED
};

const WaitlistManagement: React.FC = () => {
  const { responseData, addItem, refetch } = useAxios<{}, Waitlist[]>(
    ApiEndpoint.plm.get_waitlist,
    {
      method: "post",
      payload: {},
      loader: true,
      shouldFetch: true,
    },
  );

  const rows = Array.isArray(responseData) ? responseData : [];

  const duplicates = React.useMemo(() => {
    const appMap = new Map<number, number>();
    const posMap = new Map<string, number>(); // key = drive_name|position
    const dupApps: number[] = [];
    const dupPositions: Array<{ drive: string; position: number }> = [];

    rows.forEach((r) => {
      const appCount = appMap.get(r.application_id) || 0;
      appMap.set(r.application_id, appCount + 1);

      const key = `${r.drive_name}||${r.position}`;
      const posCount = posMap.get(key) || 0;
      posMap.set(key, posCount + 1);
    });

    appMap.forEach((count, application_id) => {
      if (count > 1) dupApps.push(application_id);
    });

    posMap.forEach((count, key) => {
      if (count > 1) {
        const [drive, pos] = key.split("||");
        dupPositions.push({ drive, position: Number(pos) });
      }
    });

    return { dupApps, dupPositions };
  }, [rows]);

  const handlePromote = async (row: Waitlist) => {
    // Front-end validations
    if (row.status !== "WAITLISTED") {
      toast.error("Only candidates with status WAITLISTED can be promoted.");
      return;
    }

    if (row.position !== 1) {
      toast.error("Only the candidate at waitlist position 1 can be promoted.");
      return;
    }

    // Prevent promote if duplicates exist for this drive or application
    const appDup = duplicates.dupApps.includes(row.application_id);
    const posDup = duplicates.dupPositions.some((p) => p.drive === row.drive_name && p.position === row.position);
    if (appDup) {
      toast.error("This application has multiple waitlist records. Fix duplicates before promoting.");
      return;
    }
    if (posDup) {
      toast.error("Duplicate waitlist positions exist for this drive. Fix duplicates before promoting.");
      return;
    }

    try {
      const payload = { waitlist_id: row.waitlist_id, application_id: row.application_id };
      const res = await addItem(payload, ApiEndpoint.plm.waitlist_promote);
      if (res) {
        toast.success("Candidate promoted");
        refetch();
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Error promoting candidate";
      toast.error(msg);
    }
  };

  const columns = React.useMemo(() => [
    { headerName: "Student Name", field: "student_name", sortable: true, filter: true },
    { headerName: "Drive Name", field: "drive_name", sortable: true, filter: true },
    { headerName: "Waitlist Position", field: "position", sortable: true, filter: true },
    { headerName: "Status", field: "status", sortable: true, filter: true },
    {
      headerName: "Actions",
      field: "action",
      cellRenderer: (params: any) => (
        <div className='flex space-x-2'>
          <button
            className={`text-sm ${params.data.position === 1 && params.data.status === 'WAITLISTED' ? 'text-green-600' : 'text-gray-400 cursor-not-allowed'}`}
            onClick={() => {
              if (params.data.position === 1 && params.data.status === 'WAITLISTED') {
                handlePromote(params.data);
              }
            }}
            title={params.data.position === 1 && params.data.status === 'WAITLISTED' ? 'Promote candidate' : 'Only position 1 WAITLISTED can be promoted'}
          >
            Promote
          </button>
        </div>
      ),
      sortable: false,
      filter: false,
    },
  ], [responseData]);

  const [testing, setTesting] = React.useState(false);
  const [testError, setTestError] = React.useState<string | null>(null);
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [applications, setApplications] = React.useState<any[]>([]);
  const [loadingApps, setLoadingApps] = React.useState(false);
  const [selectedAppId, setSelectedAppId] = React.useState<number | null>(null);
  const [selectedAppIdSearch, setSelectedAppIdSearch] = React.useState<string | null>("");
  const [positionInput, setPositionInput] = React.useState<string>("");
  const [submitting, setSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const filteredApplications = React.useMemo(() => {
    const q = (selectedAppIdSearch || "").toLowerCase().trim();
    if (!q) return applications;
    return applications.filter((a) => {
      const combined = `${a.student_name} ${a.usn} ${a.branch} ${a.drive_name || a.drive}`.toLowerCase();
      return combined.includes(q);
    });
  }, [applications, selectedAppIdSearch]);

  const testApi = async () => {
    setTesting(true);
    setTestError(null);
    try {
      const res: any = await axiosInstance.post(ApiEndpoint.plm.get_waitlist, {});
      if (!res || !res.data) {
        setTestError("No response from server");
      } else if (res.status >= 200 && res.status < 300) {
        if (res.data && res.data.data) {
          refetch();
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Network error";
      setTestError(msg);
    } finally {
      setTesting(false);
    }
  };

  const fetchApplications = async () => {
    setLoadingApps(true);
    try {
      const res: any = await axiosInstance.post(ApiEndpoint.plm.application_list, {});
      if (res && res.data) {
        // Expect payload in res.data.data or res.data
        const apps = res.data.data || res.data || [];
        setApplications(Array.isArray(apps) ? apps : []);
      }
    } catch (err: any) {
      // swallow error; user can retry by reopening modal
    } finally {
      setLoadingApps(false);
    }
  };

  const openAddModal = async () => {
    setFormError(null);
    setSelectedAppId(null);
    setPositionInput("");
    setShowAddModal(true);
    // fetch applications if not loaded
    if (applications.length === 0) await fetchApplications();
  };

  const computeNextPositionForDrive = (driveName: string) => {
    const posForDrive = rows.filter((r) => r.drive_name === driveName).map((r) => Number(r.position) || 0);
    if (posForDrive.length === 0) return 1;
    return Math.max(...posForDrive) + 1;
  };

  const handleAddSubmit = async () => {
    setFormError(null);
    if (!selectedAppId) {
      setFormError("Please select an application.");
      return;
    }

    // find application details
    const app = applications.find((a) => Number(a.application_id) === Number(selectedAppId));
    const driveName = app?.drive_name || app?.drive || "";

    // validation: one waitlist per application
    if (rows.some((r) => Number(r.application_id) === Number(selectedAppId))) {
      setFormError("This application already has a waitlist record.");
      return;
    }

    // determine position
    let position = positionInput ? Number(positionInput) : computeNextPositionForDrive(driveName);
    if (!position || position < 1) {
      setFormError("Position must be a positive integer.");
      return;
    }

    // validate position uniqueness
    if (rows.some((r) => r.drive_name === driveName && Number(r.position) === position)) {
      setFormError("This position is already taken for the selected drive.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = { application_id: selectedAppId, position };
      const res = await addItem(payload, ApiEndpoint.plm.waitlist_create);
      if (res) {
        toast.success("Added to waitlist");
        setShowAddModal(false);
        refetch();
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Error adding to waitlist";
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h3 className='text-lg leading-6 font-medium pb-5'>Waitlist Management</h3>
      {(duplicates.dupApps.length > 0 || duplicates.dupPositions.length > 0) && (
        <div className='mb-4'>
          <div className='bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-2'>
            <strong className='block'>Validation issues detected</strong>
            <div className='text-sm'>Please resolve the following before promoting candidates:</div>
            <ul className='mt-2 text-sm list-disc list-inside'>
              {duplicates.dupApps.length > 0 && (
                <li>Multiple waitlist records for {duplicates.dupApps.length} application(s).</li>
              )}
              {duplicates.dupPositions.length > 0 && (
                <li>Duplicate waitlist positions found for {duplicates.dupPositions.length} drive/position combinations.</li>
              )}
            </ul>
          </div>
        </div>
      )}
      <div className='flex items-center justify-between'>
        <div />
        <div>
          <button className='px-3 py-1 bg-indigo-600 text-white rounded text-sm' onClick={openAddModal}>Add to Waitlist</button>
        </div>
      </div>

      {rows.length === 0 && (
        <div className='bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-4'>
          <div className='flex items-center justify-between'>
            <div>
              <strong>No data returned</strong>
              <div className='text-sm'>The backend may be unreachable or returning no waitlist entries.</div>
            </div>
            <div className='flex items-center space-x-2'>
              <button
                className='px-3 py-1 bg-blue-600 text-white rounded text-sm'
                onClick={testApi}
                disabled={testing}
              >
                {testing ? "Testing..." : "Test API"}
              </button>
            </div>
          </div>
          {testError && <div className='mt-2 text-sm text-red-600'>Error: {testError}</div>}
        </div>
      )}

      <DataTable columnDefs={columns} rowData={rows} showAddButton={false} pageSize={20} headerFilter={true} />

      {/* Add modal (very small) */}
      {showAddModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center'>
          <div className='absolute inset-0 bg-black opacity-40' onClick={() => setShowAddModal(false)} />
          <div className='bg-white rounded shadow-lg p-6 z-60 w-11/12 max-w-md'>
            <h4 className='text-lg font-medium mb-3'>Add to Waitlist</h4>
            <div className='space-y-3'>
              <div>
                <label className='block text-sm'>Application</label>
                <input
                  className='mt-1 block w-full border rounded px-2 py-1'
                  placeholder='Type to search student name, USN or drive...'
                  value={String(selectedAppIdSearch ?? "")}
                  onChange={(e) => {
                    const v = e.target.value;
                    setSelectedAppIdSearch(v);
                    // reset selected id when search changes
                    setSelectedAppId(null);
                  }}
                />
                <div className='mt-1 max-h-40 overflow-auto border rounded bg-white'>
                  {loadingApps && <div className='p-2 text-sm text-gray-500'>Loading...</div>}
                  {!loadingApps && filteredApplications.length === 0 && (
                    <div className='p-2 text-sm text-gray-500'>No applications</div>
                  )}
                  {!loadingApps && filteredApplications.map((a: any) => (
                    <div
                      key={a.application_id}
                      className={`px-2 py-2 cursor-pointer hover:bg-indigo-50 ${selectedAppId === Number(a.application_id) ? 'bg-indigo-100' : ''}`}
                      onClick={() => {
                        setSelectedAppId(Number(a.application_id));
                        setSelectedAppIdSearch(`${a.student_name} — ${a.usn} (${a.branch})`);
                      }}
                    >
                      <div className='text-sm font-medium'>{a.student_name} <span className='text-xs text-gray-500'>({a.usn})</span></div>
                      <div className='text-xs text-gray-400'>{a.branch} — {a.drive_name || a.drive}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className='block text-sm'>Position (optional)</label>
                <input
                  className='mt-1 block w-full border rounded px-2 py-1'
                  value={positionInput}
                  onChange={(e) => setPositionInput(e.target.value)}
                  placeholder='Leave blank to auto-assign next position'
                />
              </div>

              {formError && <div className='text-sm text-red-600'>{formError}</div>}

              <div className='flex justify-end space-x-2'>
                <button className='px-3 py-1 border rounded text-sm' onClick={() => setShowAddModal(false)} disabled={submitting}>Cancel</button>
                <button className='px-3 py-1 bg-indigo-600 text-white rounded text-sm' onClick={handleAddSubmit} disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaitlistManagement;
