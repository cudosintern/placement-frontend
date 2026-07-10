import React, { useCallback, useMemo } from "react";
import { Outlet } from "react-router-dom";
import ModalWithForm from "../../../../components/Modal/ModalWithForm";
import ConfirmDialog from "../../../../components/Dialog/ConfirmDialog";
import StatusDialog from "../../../../components/Dialog/StatusDialog";
import DataTable from "../../../../components/Table/DataTable";
import { Schema, SchemaColumnDefs, SchemaFields } from "./companySchema";
import { ApiEndpoint } from "../../../../utils/ApiEndpoint/emsapiEndpoint";
import { PlacementApiEndpoint } from "../../../../utils/ApiEndpoint/placementApiEndpoint";
import axiosInstance from "../../../../utils/api";
import { useAxios } from "../../../../hooks/useAxios";
import { CompanyResponse } from "./responseInterface";
import { toast } from "react-toastify";
import ModalContainer from "../../../../components/Modal/ModalContainer";
import CompanyDetails from "./CompanyDetails";
import { Eye, Edit2, Ban, CheckCircle } from "lucide-react";

const CompanyList: React.FC = () => {
  const [deleteId, setDeleteId] = React.useState<CompanyResponse | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);
  const [confirmMessage, setConfirmMessage] = React.useState<string>("");
  const [editingData, setEditingData] = React.useState<Record<string, any> | null>(null);
  const [viewCompany, setViewCompany] = React.useState<CompanyResponse | null>(null);
  const [statusTarget, setStatusTarget] = React.useState<CompanyResponse | null>(null);

  const { responseData, setResponseData, addItem, editStateItem, addStateItem, refetch } = useAxios<
    {},
    any
  >(PlacementApiEndpoint.company.list, {
    method: "get",
    loader: true,
    payload: {},
    shouldFetch: true,
  });

  const useMock = process.env.REACT_APP_BYPASS_LOGIN === "true";
  const defaultData: CompanyResponse[] = React.useMemo(
    () => [
      {
        company_id: 1,
        company_name: "Demo Corp",
        company_code: "DC001",
        company_email: "info@democorp.com",
        company_phone: "1234567890",
        company_address: "123 Demo Street",
        company_contact_person: "Alice Johnson",
        company_contact_phone: "1234567890",
        company_contact_email: "alice@democorp.com",
        company_website: "https://www.democorp.com",
        company_industry: "Software",
        company_established_year: 2010,
        company_employees: 120,
        company_linkedin: "https://www.linkedin.com/company/democorp",
        status: 1,
      },
      {
        company_id: 2,
        company_name: "Acme Ltd",
        company_code: "ACM02",
        company_email: "hello@acme.com",
        company_phone: "0987654321",
        company_address: "456 Acme Road",
        company_contact_person: "Bob Smith",
        company_contact_phone: "0987654321",
        company_contact_email: "bob@acme.com",
        company_website: "https://www.acme.com",
        company_industry: "Manufacturing",
        company_established_year: 1998,
        company_employees: 450,
        company_linkedin: "https://www.linkedin.com/company/acme",
        status: 0,
      },
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
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  isActive
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${isActive ? "bg-green-500" : "bg-red-500"}`} />
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
            <div className='flex space-x-2 items-center h-full'>
              <button
                className='flex items-center space-x-1 border border-indigo-200 hover:bg-indigo-50 text-indigo-600 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95'
                onClick={() => setViewCompany(params.data)}
                title='View Details'
              >
                <Eye className="h-3.5 w-3.5" />
                <span>View</span>
              </button>
              <button
                className='flex items-center space-x-1 border border-amber-200 hover:bg-amber-50 text-amber-600 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95'
                onClick={() => handleEdit(params.data)}
                title='Edit Company'
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span>Edit</span>
              </button>
              {isActive ? (
                <button
                  className='flex items-center space-x-1 border border-red-200 hover:bg-red-50 text-red-600 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95'
                  onClick={() => openStatusDialog(params.data)}
                  title='Disable Company'
                >
                  <Ban className="h-3.5 w-3.5" />
                  <span>Disable</span>
                </button>
              ) : (
                <button
                  className='flex items-center space-x-1 border border-green-200 hover:bg-green-50 text-green-600 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95'
                  onClick={() => openStatusDialog(params.data)}
                  title='Enable Company'
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>Enable</span>
                </button>
              )}
            </div>
          );
        },
        width: 280,
        cellStyle: { textAlign: "center" },
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

  return (
    <>
      <div>
        <h3 className='text-lg leading-6 font-medium pb-5'>Company Master - List</h3>

        {isModalOpen && (
          <ModalWithForm
            title={'Company'}
            isOpen={isModalOpen}
            onSubmit={handleFormSubmit}
            onClose={closeModalHandler}
            formFields={SchemaFields}
            schema={Schema}
            size={'2xl'}
            columnLayout={2}
            initialValues={editingData || {}}
          />
        )}

        <DataTable
          columnDefs={columnDefs}
          rowData={
            Array.isArray(responseData) && responseData.length
              ? responseData
              : [
                      {
                        company_id: 1,
                        company_name: "Demo Corp",
                        company_code: "DC001",
                        company_email: "info@democorp.com",
                        company_phone: "1234567890",
                        company_address: "123 Demo Street",
                        company_contact_person: "Alice Johnson",
                        company_website: "https://www.democorp.com",
                        status: 1,
                      },
                      {
                        company_id: 2,
                        company_name: "Acme Ltd",
                        company_code: "ACM02",
                        company_email: "hello@acme.com",
                        company_phone: "0987654321",
                        company_address: "456 Acme Road",
                        company_contact_person: "Bob Smith",
                        company_website: "https://www.acme.com",
                        status: 0,
                      },
                ]
          }
          showAddButton={true}
          showExportButton={false}
          addButtonHandler={OpenModalHandler}
          headerFilter={true}
          pageSize={20}
        />

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

        <StatusDialog
          isOpen={!!statusTarget}
          onClose={() => setStatusTarget(null)}
          onEnable={() => handleStatusChange(1)}
          onDisable={() => handleStatusChange(0)}
          title={'Change Company Status'}
          message={'Select Enable to activate the company, or Disable to deactivate it.'}
        />
      </div>
      <Outlet />
    </>
  );
};

export default CompanyList;
