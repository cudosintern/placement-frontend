import React, { useCallback, useMemo } from "react";
import { Outlet } from "react-router-dom";
import ModalWithForm from "../../../../components/Modal/ModalWithForm";
import ConfirmDialog from "../../../../components/Dialog/ConfirmDialog";
import StatusDialog from "../../../../components/Dialog/StatusDialog";
import DataTable from "../../../../components/Table/DataTable";
import { Schema, SchemaColumnDefs, SchemaFields } from "./companySchema";
import { ApiEndpoint } from "../../../../utils/ApiEndpoint/emsapiEndpoint";
import { useAxios } from "../../../../hooks/useAxios";
import { CompanyResponse } from "./responseInterface";
import { GoPencil } from "react-icons/go";
import { MdOutlineDoNotDisturbAlt } from "react-icons/md";
import { FaCheckCircle } from "react-icons/fa";
import { toast } from "react-toastify";
import ModalContainer from "../../../../components/Modal/ModalContainer";
import CompanyDetails from "./CompanyDetails";

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
  >(ApiEndpoint.company.company_list, {
    method: "post",
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
        status: 1,
      },
      {
        company_id: 2,
        company_name: "Acme Ltd",
        company_code: "ACM02",
        company_email: "hello@acme.com",
        company_phone: "0987654321",
        company_address: "456 Acme Road",
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
    const deletePayload = {
      flag: "company",
      record_id: (deleteId as any).company_id ?? deleteId.id,
      status: (deleteId as any).status === 1 ? 0 : 1,
    } as any;
    console.debug("CompanyList.confirmDelete: deleteId, payload, responseData", deleteId, deletePayload, responseData);
      if (useMock) {
        // simulate toggle locally by updating responseData or the default data
        const idKey = (deleteId as any).company_id ? "company_id" : "id";
        const idVal = (deleteId as any)[idKey];
        const updated = { ...(deleteId as any), status: (deleteId as any).status === 1 ? 0 : 1 } as any;
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

      const response = await addItem(deletePayload, ApiEndpoint.master_soft_delete);
      if (!response) return;

      // If API returned updated item, update local state immediately
      const returned = response as any;
      const idKey = (deleteId as any).company_id ? "company_id" : "id";
      const idVal = (deleteId as any)[idKey];
      if (returned) {
        console.debug("CompanyList.confirmDelete: API returned, updating local state", returned);
        const source = Array.isArray(responseData) && responseData.length ? responseData.slice() : defaultData.slice();
        const newData = source.map((item: any) => (item[idKey] === idVal ? { ...item, ...returned } : item));
        setResponseData(newData as any);
      } else {
        // fallback to refetch if no returned payload
        console.debug("CompanyList.confirmDelete: API returned no payload, refetching");
        refetch();
      }
      setDeleteId(null);
  }, [addItem, deleteId, refetch]);

  const openStatusDialog = (item: CompanyResponse) => {
    setStatusTarget(item);
  };

  const handleStatusChange = useCallback(
    async (desiredStatus: number) => {
      if (!statusTarget) return;
      const idKey = (statusTarget as any).company_id ? "company_id" : "id";
      const idVal = (statusTarget as any)[idKey];

      const payload = {
        flag: "company",
        record_id: idVal,
        status: desiredStatus,
      } as any;

      console.debug("CompanyList.handleStatusChange: desiredStatus, statusTarget, payload, responseData", desiredStatus, statusTarget, payload, responseData);

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

      const response = await addItem(payload, ApiEndpoint.master_soft_delete);
      if (!response) return;

      // If API returned updated item, use it; otherwise, optimistically apply desiredStatus.
      const returned = response as any;
      const source = Array.isArray(responseData) && responseData.length ? responseData.slice() : defaultData.slice();
      const newData = source.map((item: any) =>
        item[idKey] === idVal ? { ...(item as any), ...(returned ?? {}), status: (returned?.status ?? desiredStatus) } : item,
      );
      console.debug("CompanyList.handleStatusChange: applying API/optimistic update", newData);
      setResponseData(newData as any);
      // persist when in mock mode
      try {
        if (useMock) localStorage.setItem(LS_KEY, JSON.stringify(newData));
      } catch (e) {}
      setStatusTarget(null);
    },
    [addItem, defaultData, refetch, responseData, statusTarget, useMock],
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
        headerName: "Action",
        field: "action",
        cellRenderer: (params: any) => {
          const isActive = params.data?.status === 1;
          return (
            <div className='flex space-x-2 items-center h-full'>
              <button
                className='text-sm text-blue-600 underline px-2 py-1 rounded'
                onClick={() => setViewCompany(params.data)}
                title='View'
              >
                View
              </button>
              <button
                className='text-sm text-yellow-700 px-2 py-1 rounded border'
                onClick={() => handleEdit(params.data)}
                title='Edit'
              >
                Edit
              </button>
              {isActive ? (
                <button
                  className='text-sm text-red-600 px-2 py-1 rounded border'
                  onClick={() => openStatusDialog(params.data)}
                  title='Change Status'
                >
                  Deactivate
                </button>
              ) : (
                <button
                  className='text-sm text-green-600 px-2 py-1 rounded border'
                  onClick={() => openStatusDialog(params.data)}
                  title='Change Status'
                >
                  Activate
                </button>
              )}
            </div>
          );
        },
        width: 220,
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

      const response = await addItem(updatePayload as any, ApiEndpoint.company.save_company);
      if (!response) return;

      // Update local state so UI reflects the change immediately
      const idKey = (editingData as any)?.company_id ? "company_id" : "id";
      const idVal = editingData ? (editingData as any)[idKey] : null;
      const returned = response as any;
      if (editingData) {
        // editing existing
        if (Array.isArray(responseData)) {
          const newData = responseData.map((item: any) =>
            item[idKey] === idVal ? { ...item, ...(returned ?? {}) } : item,
          );
          setResponseData(newData as any);
        } else {
          setResponseData([returned] as any);
        }
      } else {
        // adding new
        if (Array.isArray(responseData) && responseData.length) {
          setResponseData([...(responseData as any), returned] as any);
        } else {
          setResponseData([returned] as any);
        }
      }
      closeModalHandler();
    },
    [addItem, addStateItem, editStateItem, editingData],
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
            size={'lg'}
            columnLayout={1}
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
                    status: 1,
                  },
                  {
                    company_id: 2,
                    company_name: "Acme Ltd",
                    company_code: "ACM02",
                    company_email: "hello@acme.com",
                    company_phone: "0987654321",
                    company_address: "456 Acme Road",
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
        <ModalContainer isOpen={!!viewCompany} onClose={() => setViewCompany(null)} title={'Company Details'} size={'md'}>
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
