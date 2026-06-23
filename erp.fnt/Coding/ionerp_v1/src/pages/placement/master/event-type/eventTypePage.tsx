import React, { useEffect } from "react";
import DataTable from "../../../../components/Table/DataTable";
import ModalWithForm from "../../../../components/Modal/ModalWithForm";
import eventTypeService from "./eventTypeService";

import {
  Schema,
  SchemaFields,
  SchemaColumnDefs,
} from "./eventTypeSchema";

const EventTypePage = () => {
  const [eventTypes, setEventTypes] = React.useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingEventType, setEditingEventType] = React.useState<any>(null);
  
  useEffect(() => {
  const loadEventTypes = async () => {
    try {
      const response = await eventTypeService.getEventTypes();
      console.log((response as any).data);
      console.log("Event Types:", response);

      setEventTypes((response as any).data || []);
    } catch (error) {
      console.error(error);
    }
  };

    loadEventTypes();
  }, []);

const handleFormSubmit = async (data: any) => {
  console.log("Submitting:", data);

  try {
    if (editingEventType) {
      console.log("Editing Record:", editingEventType);
      await eventTypeService.updateEventType(
  editingEventType.id,
  {
    ...data,
    status: editingEventType.status ?? 1,
  }
);
    } else {
      await eventTypeService.addEventType(data);
    }

    const response = await eventTypeService.getEventTypes();
    setEventTypes((response as any).data || []);

    setIsModalOpen(false);
    setEditingEventType(null);
  } catch (error) {
    console.error(error);
  }
};

const editEventTypeHandler = (eventType: any) => {
  setEditingEventType(eventType);
  setIsModalOpen(true);
};
const columnDefsWithAction = [
  ...SchemaColumnDefs,
  {
    headerName: "Edit", 
    cellRenderer: (params: any) => (
      <button
        onClick={() => editEventTypeHandler(params.data)}
        className="bg-green-500 text-white px-2 py-1 rounded text-xs"
      >
        Edit
      </button>
    ),
  },
];

  return (
    <div>
      {isModalOpen && (
        <ModalWithForm
          title={"Event Type"}
          isOpen={isModalOpen}
          onSubmit={handleFormSubmit}
          onClose={() => setIsModalOpen(false)}
          formFields={SchemaFields}
          schema={Schema}
          size={"lg"}
          columnLayout={1}
          initialValues={editingEventType || {}}
        />
      )}

      <DataTable
        columnDefs={columnDefsWithAction}
        rowData={eventTypes}
        showAddButton={true}
        addButtonHandler={() => setIsModalOpen(true)}
        showExportButton={false}
        headerFilter={true}
        pageSize={20}
      />
    </div>
  );
};

export default EventTypePage;
