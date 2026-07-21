import React, { useCallback, useMemo } from "react";
import { Outlet } from "react-router-dom";
import ModalWithForm from "../../../../components/Modal/ModalWithForm";
import ConfirmDialog from "../../../../components/Dialog/ConfirmDialog";
import DataTable from "../../../../components/Table/DataTable";
import { Schema, SchemaColumnDefs, SchemaFields } from "./companySchema";
import { ApiEndpoint } from "../../../../utils/ApiEndpoint/emsapiEndpoint";
import { PlacementApiEndpoint } from "../../../../utils/ApiEndpoint/placementApiEndpoints";
import axiosInstance from "../../../../utils/api";
import { useAxios } from "../../../../hooks/useAxios";
import { CompanyResponse } from "./responseInterface";
import { toast } from "react-toastify";
import ModalContainer from "../../../../components/Modal/ModalContainer";
import CompanyDetails from "./CompanyDetails";
import { Eye, Edit2, Ban, CheckCircle, Building, Plus, XCircle, TrendingUp } from "lucide-react";

// ── Summary Card Component ──────────────────────────────────────────────────
const SummaryCard: React.FC<{
  label: string;
  count: number;
  icon: React.ReactNode;
  gradientClass: string;
  iconBgClass: string;
  shadowClass: string;
}> = ({ label, count, icon, gradientClass, iconBgClass, shadowClass }) => (
  <div className={`flex-grow sm:flex-1 min-w-[200px] bg-gradient-to-br ${gradientClass} text-white p-6 rounded-3xl ${shadowClass} hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300 flex items-center justify-between border border-white/10 relative overflow-hidden group`}>
    <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-white/5 rounded-full group-hover:scale-150 transition-all duration-500" />
    <div className="space-y-1 z-10">
      <p className="text-[10px] font-bold uppercase tracking-wider opacity-75">{label}</p>
      <div className="text-3xl font-extrabold tracking-tight text-white !text-white" style={{ color: '#ffffff' }}>{count}</div>
    </div>
    <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${iconBgClass} backdrop-blur-md z-10 shadow-inner group-hover:rotate-12 transition-transform duration-300`}>
      {icon}
    </div>
  </div>
);


const CompanyList: React.FC = () => {
  const [deleteId, setDeleteId] = React.useState<CompanyResponse | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);
  const [confirmMessage, setConfirmMessage] = React.useState<string>("");
  const [editingData, setEditingData] = React.useState<Record<string, any> | null>(null);
  const [viewCompany, setViewCompany] = React.useState<CompanyResponse | null>(null);
  const [statusTarget, setStatusTarget] = React.useState<CompanyResponse | null>(null);

  const useMock = false;

  const { responseData, setResponseData, addItem, editStateItem, addStateItem, refetch } = useAxios<
    {},
    any
  >(PlacementApiEndpoint.company.list, {
    method: "get",
    loader: !useMock,
    payload: {},
    shouldFetch: !useMock,
  });
  const defaultData: CompanyResponse[] = React.useMemo(
    () => [
      {
        company_id: 1,
        company_name: "Infosys",
        company_type: "MNC",
        industry: "IT / Software",
        website: "https://www.infosys.com",
        email: "info@infosys.com",
        phone: "080 2852 0261",
        address: "Electronics City, Hosur Road",
        city: "Bengaluru",
        state: "Karnataka",
        country: "India",
        pincode: "560100",
        contact_person: "Sudha Murty",
        contact_designation: "HR Lead",
        contact_phone: "9876543210",
        contact_email: "sudha@infosys.com",
        description: "Infosys is a global leader in next-generation digital services and consulting.",
        status: 1,
      },
      {
        company_id: 2,
        company_name: "TCS",
        company_type: "MNC",
        industry: "IT / Software",
        website: "https://www.tcs.com",
        email: "corporate@tcs.com",
        phone: "022 6778 9999",
        address: "TCS House, Raveline Street, Fort",
        city: "Mumbai",
        state: "Maharashtra",
        country: "India",
        pincode: "400001",
        contact_person: "Rajesh Gopinathan",
        contact_designation: "Recruiter Manager",
        contact_phone: "9876543211",
        contact_email: "rajesh@tcs.com",
        description: "Tata Consultancy Services is an IT services, consulting and business solutions organization.",
        status: 1,
      },
      {
        company_id: 3,
        company_name: "Wipro",
        company_type: "MNC",
        industry: "IT / Software",
        website: "https://www.wipro.com",
        email: "info@wipro.com",
        phone: "080 2844 0011",
        address: "Sarjapur Road, Doddakannelli",
        city: "Bengaluru",
        state: "Karnataka",
        country: "India",
        pincode: "560035",
        contact_person: "Rishad Premji",
        contact_designation: "Talent Acquisition Head",
        contact_phone: "9876543212",
        contact_email: "rishad@wipro.com",
        description: "Wipro Limited is a leading technology services and consulting company.",
        status: 1,
      },
      {
        company_id: 4,
        company_name: "Accenture",
        company_type: "MNC",
        industry: "IT / Software",
        website: "https://www.accenture.com",
        email: "india@accenture.com",
        phone: "080 4106 0000",
        address: "Electronics City Phase 1",
        city: "Bengaluru",
        state: "Karnataka",
        country: "India",
        pincode: "560100",
        contact_person: "Julie Sweet",
        contact_designation: "HR Specialist",
        contact_phone: "9876543213",
        contact_email: "julie@accenture.com",
        description: "Accenture is a leading global professional services company.",
        status: 1,
      },
      {
        company_id: 5,
        company_name: "L&T",
        company_type: "Public Ltd",
        industry: "Manufacturing",
        website: "https://www.larsentoubro.com",
        email: "info@larsentoubro.com",
        phone: "022 6752 5656",
        address: "L&T House, Ballard Estate",
        city: "Mumbai",
        state: "Maharashtra",
        country: "India",
        pincode: "400001",
        contact_person: "A. M. Naik",
        contact_designation: "Corporate HR Lead",
        contact_phone: "9876543214",
        contact_email: "naik@larsentoubro.com",
        description: "Larsen & Toubro Limited is an Indian multinational conglomerate company.",
        status: 1,
      },
      {
        company_id: 6,
        company_name: "HDFC Bank",
        company_type: "Public Ltd",
        industry: "Finance / Banking",
        website: "https://www.hdfcbank.com",
        email: "banking@hdfcbank.com",
        phone: "022 6060 6161",
        address: "Senapati Bapat Marg, Lower Parel",
        city: "Mumbai",
        state: "Maharashtra",
        country: "India",
        pincode: "400013",
        contact_person: "Sashidhar Jagdishan",
        contact_designation: "HR Officer",
        contact_phone: "9876543215",
        contact_email: "sashi@hdfcbank.com",
        description: "HDFC Bank Limited is an Indian banking and financial services company.",
        status: 1,
      }
    ],
    [],
  );

  const LS_KEY = "placement_company_demo";

  // Load persisted demo data when in mock mode
  React.useEffect(() => {
    if (!useMock) return;
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CompanyResponse[];
        if (Array.isArray(parsed) && parsed.length) {
          console.debug("CompanyList: loaded persisted demo data", parsed);
          setResponseData(parsed as any);
          return;
        }
      }
    } catch (e) {
      // ignore parse errors
    }
    // fallback to default data
    console.debug("CompanyList: no persisted demo data, using defaultData", defaultData);
    setResponseData(defaultData as any);
  }, [useMock]);

  const closeModalHandler = () => {
    setIsModalOpen(false);
    setEditingData(null);
  };

  const OpenModalHandler = () => {
    setIsModalOpen(true);
  };

  const handleEdit = useCallback((data: Record<string, any>) => {
    setEditingData(data);
    setIsModalOpen(true);
  }, []);

  const handleDelete = useCallback((item: CompanyResponse, message: string) => {
    setConfirmMessage(message);
    setDeleteId(item);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deleteId) return;
    const idKey = (deleteId as any).company_id ? "company_id" : "id";
    const idVal = (deleteId as any)[idKey];
    const desiredStatus = (deleteId as any).status === 1 ? 0 : 1;

    console.debug("CompanyList.confirmDelete: deleteId, desiredStatus, responseData", deleteId, desiredStatus, responseData);
      if (useMock) {
        // simulate toggle locally by updating responseData or the default data
        const updated = { ...(deleteId as any), status: desiredStatus } as any;
        const source = Array.isArray(responseData) && responseData.length ? responseData.slice() : defaultData.slice();
        const newData = source.map((item: any) => (item[idKey] === idVal ? { ...item, ...updated } : item));
        setResponseData(newData as any);
        console.debug("CompanyList.confirmDelete: applied mock newData", newData);
        try {
          localStorage.setItem(LS_KEY, JSON.stringify(newData));
        } catch (e) {}
        toast.success("Status updated (mock)");
        setDeleteId(null);
        return;
      }

      try {
        const endpoint = desiredStatus === 1
          ? PlacementApiEndpoint.company.activate
          : PlacementApiEndpoint.company.deactivate;

        const res: any = await axiosInstance.put(endpoint, {
          company_id: idVal,
          status: desiredStatus
        });

        if (res.data?.status) {
          toast.success(res.data?.message || "Status updated successfully!");
          const returned = res.data?.data as any;
          const source = Array.isArray(responseData) && responseData.length ? responseData.slice() : defaultData.slice();
          const newData = source.map((item: any) => (item[idKey] === idVal ? { ...item, ...returned, status: desiredStatus } : item));
          setResponseData(newData as any);
        } else {
          refetch();
        }
      } catch (err: any) {
        console.error("Failed to toggle status", err);
        toast.error(err.response?.data?.message || "Failed to update status.");
      }
      setDeleteId(null);
  }, [deleteId, responseData, defaultData, useMock, refetch]);

  const openStatusDialog = (item: CompanyResponse) => {
    setStatusTarget(item);
  };

  const handleStatusChange = useCallback(
    async (desiredStatus: number) => {
      if (!statusTarget) return;
      const idKey = (statusTarget as any).company_id ? "company_id" : "id";
      const idVal = (statusTarget as any)[idKey];

      console.debug("CompanyList.handleStatusChange: desiredStatus, statusTarget, responseData", desiredStatus, statusTarget, responseData);

      if (useMock) {
        const updated = { ...(statusTarget as any), status: desiredStatus } as any;
        const source = Array.isArray(responseData) && responseData.length ? responseData.slice() : defaultData.slice();
        const newData = source.map((item: any) => (item[idKey] === idVal ? { ...item, ...updated } : item));
        console.debug("CompanyList.handleStatusChange: applying mock update", newData);
        setResponseData(newData as any);
        try {
          localStorage.setItem(LS_KEY, JSON.stringify(newData));
        } catch (e) {}
        toast.success(`Status updated (mock)`);
        setStatusTarget(null);
        return;
      }

      try {
        const endpoint = desiredStatus === 1
          ? PlacementApiEndpoint.company.activate
          : PlacementApiEndpoint.company.deactivate;

        const res: any = await axiosInstance.put(endpoint, {
          company_id: idVal,
          status: desiredStatus
        });

        if (res.data?.status) {
          toast.success(res.data?.message || "Status updated successfully!");
          const returned = res.data?.data as any;
          const source = Array.isArray(responseData) && responseData.length ? responseData.slice() : defaultData.slice();
          const newData = source.map((item: any) =>
            item[idKey] === idVal ? { ...(item as any), ...(returned ?? {}), status: desiredStatus } : item,
          );
          setResponseData(newData as any);
        } else {
          refetch();
        }
      } catch (err: any) {
        console.error("Failed to update status", err);
        toast.error(err.response?.data?.message || "Failed to update status.");
      }
      setStatusTarget(null);
    },
    [defaultData, refetch, responseData, statusTarget, useMock],
  );

  const columnDefs = useMemo(() => {
    const apiUrlInformation = SchemaColumnDefs;
    return [
      ...apiUrlInformation.map((col: any) => ({
        ...col,
        flex: 1,
        minWidth: 100,
      })),
      {
        headerName: "Status",
        field: "status",
        sortable: true,
        filter: true,
        cellRenderer: (params: any) => {
          const isActive = params.value === 1;
          return (
            <div className="flex items-center h-full">
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
                    : "bg-rose-50 text-rose-700 border border-rose-200/50"
                }`}
              >
                <span className="relative flex h-1.5 w-1.5 mr-1.5">
                  {isActive && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  )}
                  <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isActive ? "bg-emerald-500" : "bg-rose-500"}`}></span>
                </span>
                {isActive ? "Active" : "Disabled"}
              </span>
            </div>
          );
        },
        width: 120,
        flex: 0,
      },
      {
        headerName: "Action",
        field: "action",
        cellRenderer: (params: any) => {
          const isActive = params.data?.status === 1;
          return (
            <div className="flex items-center justify-center space-x-2.5 h-full w-full">
              <button
                className="p-2 border border-indigo-100 hover:bg-indigo-50 text-indigo-600 rounded-full transition-all duration-150 active:scale-90"
                onClick={() => setViewCompany(params.data)}
                title="View Details"
              >
                <Eye className="h-4 w-4" />
              </button>
              <button
                className="p-2 border border-amber-100 hover:bg-amber-50 text-amber-600 rounded-full transition-all duration-150 active:scale-90"
                onClick={() => handleEdit(params.data)}
                title="Edit Company"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              {isActive ? (
                <button
                  className="p-2 border border-red-100 hover:bg-red-50 text-red-500 rounded-full transition-all duration-150 active:scale-90"
                  onClick={() => openStatusDialog(params.data)}
                  title="Disable Company"
                >
                  <Ban className="h-4 w-4" />
                </button>
              ) : (
                <button
                  className="p-2 border border-emerald-100 hover:bg-emerald-50 text-emerald-600 rounded-full transition-all duration-150 active:scale-90"
                  onClick={() => openStatusDialog(params.data)}
                  title="Enable Company"
                >
                  <CheckCircle className="h-4 w-4" />
                </button>
              )}
            </div>
          );
        },
        width: 160,
        cellStyle: { display: "flex", alignItems: "center", justifyContent: "center" },
        filter: false,
        editable: false,
        sortable: false,
        flex: 0,
      },
    ];
  }, [handleEdit, openStatusDialog]);

  const handleFormSubmit = useCallback(
    async (data: any) => {
      const updatePayload = {
        ...data,
        company_id: editingData ? (editingData as any).company_id ?? editingData.id : null,
        status: editingData ? (editingData as any).status : 1,
      } as any;

      if (useMock) {
        console.debug("CompanyList.handleFormSubmit: mock save payload", updatePayload, "editingData", editingData, "before responseData", responseData);
        // Simulate save locally and persist to localStorage
        if (editingData) {
          const idKey = (editingData as any).company_id ? "company_id" : "id";
          const idVal = (editingData as any)[idKey];
          const updated = { ...(editingData as any), ...updatePayload } as any;
          const source = Array.isArray(responseData) && responseData.length ? responseData.slice() : defaultData.slice();
          const newData = source.map((item: any) => (item[idKey] === idVal ? { ...item, ...updated } : item));
          setResponseData(newData as any);
          try {
            localStorage.setItem(LS_KEY, JSON.stringify(newData));
          } catch (e) {}
          toast.success("Company updated (mock)");
          console.debug("CompanyList.handleFormSubmit: applied mock edit newData", newData);
        } else {
          // create a mock id and mark active by default
          const newId = Math.floor(Math.random() * 100000) + 100;
          const newItem = { ...(updatePayload as any), company_id: newId, status: 1 } as any;
          const source = Array.isArray(responseData) && responseData.length ? responseData.slice() : defaultData.slice();
          const newData = [...source, newItem];
          setResponseData(newData as any);
          try {
            localStorage.setItem(LS_KEY, JSON.stringify(newData));
          } catch (e) {}
          toast.success("Company saved (mock)");
          console.debug("CompanyList.handleFormSubmit: applied mock add newData", newData);
        }
        closeModalHandler();
        return;
      }

      try {
        let res: any;
        if (editingData) {
          // Edit: PUT request
          res = await axiosInstance.put(PlacementApiEndpoint.company.save, updatePayload);
          toast.success("Company updated successfully!");
        } else {
          // Add: POST request
          res = await axiosInstance.post(PlacementApiEndpoint.company.save, updatePayload);
          toast.success("Company registered successfully!");
        }

        const returned = res.data?.data as any;
        const idKey = editingData?.company_id ? "company_id" : "id";
        const idVal = editingData ? editingData[idKey] : null;

        if (editingData) {
          if (Array.isArray(responseData)) {
            const newData = responseData.map((item: any) =>
              item[idKey] === idVal ? { ...item, ...(returned ?? {}) } : item,
            );
            setResponseData(newData as any);
          } else {
            setResponseData([returned] as any);
          }
        } else {
          if (Array.isArray(responseData) && responseData.length) {
            setResponseData([...(responseData as any), returned] as any);
          } else {
            setResponseData([returned] as any);
          }
        }
      } catch (err: any) {
        console.error("Failed to save company", err);
        toast.error(err.response?.data?.message || "Failed to save company.");
      }
      closeModalHandler();
    },
    [editingData, responseData],
  );

  // Dynamic stats calculation
  const totalComp = Array.isArray(responseData) ? responseData.length : defaultData.length;
  const activeComp = Array.isArray(responseData) 
    ? responseData.filter((c: any) => c.status === 1).length 
    : defaultData.filter((c: any) => c.status === 1).length;
  const disabledComp = Array.isArray(responseData) 
    ? responseData.filter((c: any) => c.status === 0).length 
    : defaultData.filter((c: any) => c.status === 0).length;
  const uniqueInd = Array.isArray(responseData) 
    ? new Set(responseData.map((c: any) => c.industry).filter(Boolean)).size 
    : new Set(defaultData.map((c: any) => c.industry).filter(Boolean)).size;

  return (
    <>
      <div className="space-y-6">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl shadow-lg border border-slate-800 relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute left-1/3 bottom-0 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="z-10 space-y-1">
            <h2 className="text-2xl font-extrabold tracking-tight">Company Directory</h2>
            <p className="text-xs text-indigo-200/70 font-medium">Manage corporate partners, industry sectors, recruiter contacts, and status logs.</p>
          </div>
          <button
            onClick={OpenModalHandler}
            className="z-10 flex items-center space-x-2 bg-white hover:bg-indigo-50 text-indigo-950 hover:text-indigo-900 text-sm font-bold px-5 py-3 rounded-2xl shadow-md hover:shadow-indigo-500/20 transition-all duration-200 active:scale-95 shadow-[0_8px_30px_rgb(99,102,241,0.25)]"
          >
            <Plus className="h-4 w-4 text-indigo-600" />
            <span>Add Company</span>
          </button>
        </div>

        {/* Summary stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <SummaryCard
            label="Total Partners"
            count={totalComp}
            icon={<Building className="h-5 w-5 text-white" />}
            gradientClass="from-indigo-600 to-indigo-500"
            iconBgClass="bg-white/20"
            shadowClass="shadow-[0_10px_25px_-5px_rgba(79,70,229,0.25)]"
          />
          <SummaryCard
            label="Active Partners"
            count={activeComp}
            icon={<CheckCircle className="h-5 w-5 text-white" />}
            gradientClass="from-emerald-600 to-emerald-500"
            iconBgClass="bg-white/20"
            shadowClass="shadow-[0_10px_25px_-5px_rgba(16,185,129,0.25)]"
          />
          <SummaryCard
            label="Disabled Partners"
            count={disabledComp}
            icon={<XCircle className="h-5 w-5 text-white" />}
            gradientClass="from-rose-600 to-red-500"
            iconBgClass="bg-white/20"
            shadowClass="shadow-[0_10px_25px_-5px_rgba(239,68,68,0.25)]"
          />
          <SummaryCard
            label="Industry Sectors"
            count={uniqueInd}
            icon={<TrendingUp className="h-5 w-5 text-white" />}
            gradientClass="from-cyan-600 to-blue-500"
            iconBgClass="bg-white/20"
            shadowClass="shadow-[0_10px_25px_-5px_rgba(6,182,212,0.25)]"
          />
        </div>

        {isModalOpen && (
          <ModalWithForm
            title={editingData ? 'Edit Company' : 'Add Company'}
            isOpen={isModalOpen}
            onSubmit={handleFormSubmit}
            onClose={closeModalHandler}
            formFields={SchemaFields}
            schema={Schema}
            size={'4xl'}
            columnLayout={2}
            initialValues={editingData || {}}
          />
        )}

        <div className="bg-white dark:bg-slate-950 rounded-3xl border border-gray-100 dark:border-slate-800 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <DataTable
            columnDefs={columnDefs}
            rowData={Array.isArray(responseData) && responseData.length ? responseData : defaultData}
            showAddButton={false}
            showExportButton={false}
            headerFilter={true}
            pageSize={20}
          />
        </div>

        <ConfirmDialog
          isOpen={deleteId !== null}
          onClose={() => setDeleteId(null)}
          onConfirm={confirmDelete}
          title='Confirm'
          message={confirmMessage}
        />
        <ModalContainer isOpen={!!viewCompany} onClose={() => setViewCompany(null)} title={'Company Details'} size={'5xl'}>
          <CompanyDetails company={viewCompany} />
        </ModalContainer>

        <ConfirmDialog
          isOpen={statusTarget !== null}
          onClose={() => setStatusTarget(null)}
          onConfirm={() => statusTarget && handleStatusChange(statusTarget.status === 1 ? 0 : 1)}
          title='Confirm Status Change'
          message={statusTarget ? (statusTarget.status === 1 ? `Are you sure you want to disable ${statusTarget.company_name}?` : `Are you sure you want to activate ${statusTarget.company_name}?`) : ''}
        />
      </div>
      <Outlet />
    </>
  );
};

export default CompanyList;
