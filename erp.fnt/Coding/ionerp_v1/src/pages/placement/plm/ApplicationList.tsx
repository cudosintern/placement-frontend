import React from "react";
import DataTable from "../../../components/Table/DataTable";
import { useAxios } from "../../../hooks/useAxios";
import { ApiEndpoint } from "../../../utils/ApiEndpoint/emsapiEndpoint";
import axiosInstance from "../../../utils/api";
import { useState } from "react";

type Application = {
  application_id: number;
  student_name: string;
  usn: string;
  branch: string;
  cgpa?: number;
  status: string; // APPLIED | SHORTLISTED | WAITLISTED | REJECTED
  applied_at: string;
};

const ApplicationList: React.FC = () => {
  const { responseData, addItem, refetch } = useAxios<{}, Application[]>(
    ApiEndpoint.plm.application_list,
    {
      method: "post",
      payload: {},
      loader: true,
      shouldFetch: true,
    },
  );

  const handleAction = async (row: any, action: string) => {
    if (action === "Shortlist") {
      const payload = { application_id: row.application_id };
      const res = await addItem(payload, ApiEndpoint.plm.shortlist_create);
      if (res) refetch();
    } else if (action === "Waitlist") {
      const payload = { application_id: row.application_id };
      const res = await addItem(payload, ApiEndpoint.plm.waitlist_create);
      if (res) refetch();
    } else if (action === "Reject") {
      const payload = { application_id: row.application_id, status: "REJECTED" };
      const res = await addItem(payload, ApiEndpoint.plm.application_update);
      if (res) refetch();
    }
  };

  const columns = React.useMemo(() => {
    return [
      { headerName: "Student Name", field: "student_name", sortable: true, filter: true },
      { headerName: "USN", field: "usn", sortable: true, filter: true },
      { headerName: "Branch", field: "branch", sortable: true, filter: true },
      { headerName: "CGPA", field: "cgpa", sortable: true, filter: true },
      { headerName: "Application Status", field: "status", sortable: true, filter: true },
      { headerName: "Applied Date", field: "applied_at", sortable: true, filter: true, cellRenderer: (params: any) => {
          const v = params.value;
          if (!v) return '-';
          try {
            const d = new Date(v);
            return d.toLocaleString();
          } catch {
            return v;
          }
        } },
      {
        headerName: "Actions",
        field: "action",
        cellRenderer: (params: any) => {
          return (
              <div className='flex space-x-2'>
              <button
                className={`text-sm ${params.data.status === 'APPLIED' ? 'text-blue-600 underline' : 'text-gray-400'}`}
                onClick={() => {
                  if (params.data.status !== 'APPLIED') return;
                  const ok = window.confirm('Shortlist this candidate?');
                  if (!ok) return;
                  handleAction(params.data, 'Shortlist');
                }}
                disabled={params.data.status !== 'APPLIED'}
              >Shortlist</button>
              <button
                className={`text-sm ${params.data.status === 'APPLIED' ? 'text-yellow-700' : 'text-gray-400'}`}
                onClick={() => {
                  if (params.data.status !== 'APPLIED') return;
                  const ok = window.confirm('Add this candidate to waitlist?');
                  if (!ok) return;
                  handleAction(params.data, 'Waitlist');
                }}
                disabled={params.data.status !== 'APPLIED'}
              >Waitlist</button>
              <button className='text-sm text-red-600' onClick={() => {
                const ok = window.confirm('Reject this application?');
                if (!ok) return;
                handleAction(params.data, 'Reject');
              }}>Reject</button>
            </div>
          );
        },
        sortable: false,
        filter: false,
      },
    ];
  }, [responseData]);

  const rows = Array.isArray(responseData) ? responseData : [];

  const [testing, setTesting] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);

  const testApi = async () => {
    setTesting(true);
    setTestError(null);
    try {
      const res: any = await axiosInstance.post(ApiEndpoint.plm.application_list, {});
      if (!res || !res.data) {
        setTestError("No response from server");
      } else if (res.status >= 200 && res.status < 300) {
        // server reachable; if data present, refetch
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

  return (
    <div>
      <h3 className='text-lg leading-6 font-medium pb-5'>Application List</h3>
      {rows.length === 0 && (
        <div className='bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-4'>
          <div className='flex items-center justify-between'>
            <div>
              <strong>No data returned</strong>
              <div className='text-sm'>The backend may be unreachable or returning no applications.</div>
            </div>
            <div className='flex items-center space-x-2'>
              <button
                className='px-3 py-1 bg-blue-600 text-white rounded text-sm'
                onClick={testApi}
                disabled={testing}
              >
                {testing ? "Testing..." : "Test API"}
              </button>
              {/* no demo mode: use live backend */}
            </div>
          </div>
          {testError && <div className='mt-2 text-sm text-red-600'>Error: {testError}</div>}
        </div>
      )}
      <DataTable columnDefs={columns} rowData={rows} showAddButton={false} pageSize={20} headerFilter={true} />
    </div>
  );
};

export default ApplicationList;
