Mock backend for PLM endpoints

Start:

1. cd backend
2. npm install
3. npm start

Available endpoints (all POST):
- /plm/application_list => returns sample applications
- /plm/waitlist/list => returns current waitlist entries
- /plm/waitlist/create => payload { application_id, position? }
- /plm/waitlist/promote => payload { waitlist_id, application_id }

This is an in-memory mock server intended for local frontend development. Data is not persisted across restarts.