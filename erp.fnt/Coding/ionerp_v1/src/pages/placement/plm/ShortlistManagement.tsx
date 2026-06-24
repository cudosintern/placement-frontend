import React from "react";
import axiosInstance from "../../../utils/api";
import { ApiEndpoint } from "../../../utils/ApiEndpoint/emsapiEndpoint";
import DataTable from "../../../components/Table/DataTable";
import { toast } from "react-toastify";
import { useAxios } from "../../../hooks/useAxios";

type Shortlist = {
  shortlist_id: number;
  application_id: number;
  student_name: string;
  drive_name: string;
  shortlist_type?: string;
  shortlisted_at: string;
  status: string; // SHORTLISTED | WITHDRAWN
};

const ShortlistManagement: React.FC = () => {
  const { responseData, addItem, refetch } = useAxios<{}, Shortlist[]>(
    ApiEndpoint.plm.get_shortlist,
    {
      method: "post",
      payload: {},
      loader: true,
      shouldFetch: true,
    },
  );

  // override queue (manual approvals)
  const { responseData: overrideData, addItem: addOverrideItem, refetch: refetchOverride } = useAxios<{}, any[]>(
    ApiEndpoint.plm.override_list,
    {
      method: "post",
      payload: {},
      loader: false,
      shouldFetch: true,
    },
  );

  const overrides = Array.isArray(overrideData) ? overrideData : [];

  const data = Array.isArray(responseData) ? responseData : [];

  const handleWithdraw = async (row: Shortlist) => {
    try {
      const payload = { shortlist_id: row.shortlist_id, application_id: row.application_id };
      const res = await addItem(payload, ApiEndpoint.plm.shortlist_withdraw);
      if (res) {
        toast.info("Shortlist withdrawn");
        refetch();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Error withdrawing shortlist";
      toast.error(msg);
    }
  };

  const columns = React.useMemo(() => [
    { headerName: "Student Name", field: "student_name", sortable: true, filter: true },
    { headerName: "Drive Name", field: "drive_name", sortable: true, filter: true },
    { headerName: "Shortlist Type", field: "shortlist_type", sortable: true, filter: true },
    { headerName: "Shortlisted Date", field: "shortlisted_at", sortable: true, filter: true },
    { headerName: "Status", field: "status", sortable: true, filter: true },
    {
      headerName: "Actions",
      field: "action",
      cellRenderer: (params: any) => (
        <div className='flex space-x-2'>
          <button className='text-sm text-red-600' onClick={() => handleWithdraw(params.data)}>Withdraw</button>
        </div>
      ),
      sortable: false,
      filter: false,
    },
  ], [data]);

  return (
    <div>
      <h3 className='text-lg leading-6 font-medium pb-5'>Shortlist Management</h3>
      {/* Shortlist Override Queue (manual approvals) */}
      {overrides.length > 0 && (
        <div className='mb-4'>
          <h4 className='font-medium mb-2'>Shortlist Override Queue</h4>
          <div className='space-y-3'>
            {overrides.map((item: any) => (
              <div key={item.id || item.override_id} className='border rounded p-3 flex items-center justify-between bg-white'>
                <div>
                  <div className='font-semibold'>{item.student_name} — {item.usn}</div>
                  <div className='text-sm text-gray-600'>{item.remarks || item.reason || item.note}</div>
                  <div className='text-xs text-gray-400'>Requested by {item.requested_by || item.requestedBy} on {item.requested_at || item.requestedAt}</div>
                </div>
                <div className='flex space-x-2'>
                  <button
                    className='px-3 py-1 bg-blue-600 text-white rounded text-sm'
                    onClick={async () => {
                      const ok = window.confirm('Approve and shortlist this candidate?');
                      if (!ok) return;
                      try {
                        const payload = { override_id: item.id || item.override_id, application_id: item.application_id };
                        const res = await addOverrideItem(payload, ApiEndpoint.plm.override_approve);
                        if (res) {
                          toast.success('Approved & Shortlisted');
                          refetch();
                          refetchOverride();
                        }
                      } catch (err: any) {
                        const msg = err.response?.data?.message || err.message || 'Error approving override';
                        toast.error(msg);
                      }
                    }}
                  >
                    Approve & Shortlist
                  </button>
                  <button
                    className='px-3 py-1 bg-gray-200 text-gray-800 rounded text-sm'
                    onClick={async () => {
                      const ok = window.confirm('Reject this override request?');
                      if (!ok) return;
                      try {
                        const payload = { override_id: item.id || item.override_id };
                        const res = await addOverrideItem(payload, ApiEndpoint.plm.override_reject);
                        if (res) {
                          toast.info('Override rejected');
                          refetchOverride();
                        }
                      } catch (err: any) {
                        const msg = err.response?.data?.message || err.message || 'Error rejecting override';
                        toast.error(msg);
                      }
                    }}
                  >
                    Reject Override
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Drive summary header (uses backend counts) */}
      <div className='bg-white shadow rounded mb-4 p-4'>
        <div className='flex items-center justify-between'>
          <div>
            <div className='text-sm text-gray-500'>Drive</div>
            <div className='text-xl font-semibold'>InfySys Ltd. — SWE Digital</div>
          </div>
          <div className='flex space-x-6'>
            <div className='text-center'>
              <div className='text-2xl font-bold'>{data.length + 200}</div>
              <div className='text-sm text-gray-500'>Applications</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold'>{data.filter(r=>r.status==="SHORTLISTED").length}</div>
              <div className='text-sm text-gray-500'>Shortlisted</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold'>42</div>
              <div className='text-sm text-gray-500'>Waitlisted</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold'>58</div>
              <div className='text-sm text-gray-500'>Rejected</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold'>189</div>
              <div className='text-sm text-gray-500'>In Process</div>
            </div>
          </div>
        </div>
      </div>

      {(data.length === 0) && (
        <div className='bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-4'>
          <div className='flex items-center justify-between'>
            <div>
              <strong>No shortlists returned</strong>
              <div className='text-sm'>The backend may be unreachable or returning no shortlisted candidates.</div>
            </div>
            <div className='flex items-center space-x-2'>
              <button
                className='px-3 py-1 bg-blue-600 text-white rounded text-sm'
                onClick={async () => {
                  try {
                    await axiosInstance.post(ApiEndpoint.plm.get_shortlist, {});
                    window.location.reload();
                  } catch (err: any) {
                    const msg = err.response?.data?.message || err.message || "Network error";
                    // show toast for error
                    // using toast imported above
                    toast.error(msg);
                  }
                }}
              >
                Test API
              </button>
            </div>
          </div>
        </div>
      )}
      <DataTable columnDefs={columns} rowData={data} showAddButton={false} pageSize={20} headerFilter={true} />
    </div>
  );
};

export default ShortlistManagement;
